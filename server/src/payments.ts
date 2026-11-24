import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { quote } from "./pricing.js";
import {
  createPaymentIntent,
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  paymentsUnavailableError,
  type PaymentMethod,
} from "./payments-client.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

const ordersUrl = process.env.ORDERS_URL ?? "http://127.0.0.1:4002";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cardFromBody(body: Record<string, unknown> | null | undefined) {
  const card = body?.card as Record<string, unknown> | undefined;
  if (!card || typeof card !== "object") return null;
  const number = text(card.number);
  const cvc = text(card.cvc);
  const expMonth = Number(card.expMonth);
  const expYear = Number(card.expYear);
  if (!number || !cvc || !Number.isInteger(expMonth) || !Number.isInteger(expYear)) return null;
  return { number, expMonth, expYear, cvc };
}

async function ordersFetch(
  user: SessionUser,
  pathname: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("x-datalab-user", user.id);
  headers.set("x-datalab-role", user.role);
  headers.set("x-datalab-email", user.email);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(new URL(pathname, ordersUrl), { ...init, headers });
}

async function estimateCheckoutTotal(user: SessionUser, fulfillment: string) {
  const cartResponse = await ordersFetch(user, "/cart");
  if (!cartResponse.ok) {
    const body = await cartResponse.text();
    throw Object.assign(new Error(body || "Could not read cart."), {
      status: cartResponse.status,
    });
  }
  const cart = (await cartResponse.json()) as {
    items: { lineTotalCents: number }[];
    subtotalCents: number;
  };
  if (!cart.items?.length) {
    throw Object.assign(new Error("Cart is empty."), { status: 400 });
  }
  const priced = quote(cart.subtotalCents);
  const shippingCents = fulfillment === "pickup" ? 0 : priced.shippingCents;
  return cart.subtotalCents + shippingCents + priced.taxCents;
}

export async function registerPaymentsGateway(app: FastifyInstance, { requireUser }: Deps) {
  app.get("/api/payment-methods", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    try {
      const result = await listPaymentMethods(user.id);
      return { paymentMethods: result.data };
    } catch (error) {
      const failure = paymentsUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });

  app.post<{
    Body: {
      card?: { number?: string; expMonth?: number; expYear?: number; cvc?: string };
    };
  }>("/api/payment-methods", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const card = cardFromBody(request.body as Record<string, unknown>);
    if (!card) {
      return reply.code(400).send({ error: "Send card number, expMonth, expYear, and cvc." });
    }
    try {
      const method = await createPaymentMethod({ customer: user.id, card });
      return reply.code(201).send({ paymentMethod: method });
    } catch (error) {
      const failure = paymentsUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/api/payment-methods/:id",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      try {
        const owned = await listPaymentMethods(user.id);
        if (!owned.data.some((method) => method.id === request.params.id)) {
          return reply.code(404).send({ error: "Payment method not found." });
        }
        const result = await deletePaymentMethod(request.params.id);
        return result;
      } catch (error) {
        const failure = paymentsUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }
    },
  );

  app.post<{
    Body: {
      fulfillment?: string;
      locationId?: string;
      shipName?: string;
      shipLine1?: string;
      shipCity?: string;
      shipRegion?: string;
      shipPostalCode?: string;
      shipCountry?: string;
      paymentMethodId?: string;
      saveCard?: boolean;
      card?: { number?: string; expMonth?: number; expYear?: number; cvc?: string };
    };
  }>("/api/checkout", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const fulfillment = text(request.body?.fulfillment) || "ship";
    let paymentMethodId = text(request.body?.paymentMethodId);
    const saveCard = Boolean(request.body?.saveCard);
    const card = cardFromBody(request.body as Record<string, unknown>);
    let createdEphemeral: PaymentMethod | null = null;

    try {
      if (!paymentMethodId) {
        if (!card) {
          return reply
            .code(400)
            .send({ error: "Choose a saved card or enter card details to pay." });
        }
        createdEphemeral = await createPaymentMethod({ customer: user.id, card });
        paymentMethodId = createdEphemeral.id;
      }

      const amount = await estimateCheckoutTotal(user, fulfillment);
      const intent = await createPaymentIntent({
        amount,
        currency: "usd",
        customer: user.id,
        payment_method: paymentMethodId,
        confirm: true,
      });

      if (intent.status !== "succeeded") {
        if (createdEphemeral && !saveCard) {
          await deletePaymentMethod(createdEphemeral.id).catch(() => undefined);
        }
        return reply.code(402).send({
          error: "Payment was not successful.",
          paymentIntent: intent,
        });
      }

      if (createdEphemeral && !saveCard) {
        await deletePaymentMethod(createdEphemeral.id).catch(() => undefined);
      }

      const checkoutBody = {
        fulfillment,
        locationId: text(request.body?.locationId) || undefined,
        shipName: text(request.body?.shipName),
        shipLine1: text(request.body?.shipLine1),
        shipCity: text(request.body?.shipCity),
        shipRegion: text(request.body?.shipRegion),
        shipPostalCode: text(request.body?.shipPostalCode),
        shipCountry: text(request.body?.shipCountry) || "US",
        paymentIntentId: intent.id,
        paymentLast4: intent.card?.last4 ?? createdEphemeral?.card.last4,
        paymentBrand: intent.card?.brand ?? createdEphemeral?.card.brand,
      };

      const ordersResponse = await ordersFetch(user, "/checkout", {
        method: "POST",
        body: JSON.stringify(checkoutBody),
      });
      const ordersText = await ordersResponse.text();
      return reply
        .code(ordersResponse.status)
        .type(ordersResponse.headers.get("content-type") ?? "application/json")
        .send(ordersText);
    } catch (error) {
      if (createdEphemeral && !saveCard) {
        await deletePaymentMethod(createdEphemeral.id).catch(() => undefined);
      }
      const status =
        typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : undefined;
      if (status === 400 || status === 402 || status === 404 || status === 409) {
        const failure = paymentsUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }
      if (status && status < 500 && error instanceof Error) {
        return reply.code(status).send({ error: error.message });
      }
      const failure = paymentsUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });
}
