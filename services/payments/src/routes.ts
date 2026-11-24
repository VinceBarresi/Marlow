import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { requireBearer, type AuthConfig } from "./auth.js";
import { MockStripeClient, type TestCardKey } from "./processor.js";
import { signAccessToken } from "./token.js";

const SERVICE_TOKEN_TTL = 3600;

type Deps = {
  pool: pg.Pool;
  processor: MockStripeClient;
  auth: AuthConfig;
  clientId: string;
  clientSecret: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function newId(prefix: "pm" | "pi") {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

function publicMethod(row: {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  fingerprint: string;
  created_at: Date;
}) {
  return {
    id: row.id,
    object: "payment_method",
    type: "card",
    card: {
      brand: row.brand,
      last4: row.last4,
      expMonth: row.exp_month,
      expYear: row.exp_year,
      fingerprint: row.fingerprint,
    },
    createdAt: row.created_at,
  };
}

export async function registerPayments(app: FastifyInstance, deps: Deps) {
  const { pool, processor, auth, clientId, clientSecret } = deps;
  const serviceAuth = requireBearer(auth, ["payments"]);

  app.post<{
    Body: {
      grant_type?: string;
      client_id?: string;
      client_secret?: string;
    };
  }>("/oauth/token", async (request, reply) => {
    const grant = text(request.body?.grant_type) || "client_credentials";
    if (grant !== "client_credentials") {
      return reply.code(400).send({ error: "Unsupported grant_type." });
    }
    const id = text(request.body?.client_id);
    const secret = text(request.body?.client_secret);
    if (id !== clientId || secret !== clientSecret) {
      return reply.code(401).send({ error: "Invalid client credentials." });
    }
    const accessToken = signAccessToken(
      { sub: `service:${id}`, scope: "payments", typ: "service" },
      auth.tokenSecret,
      SERVICE_TOKEN_TTL,
    );
    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: SERVICE_TOKEN_TTL,
      scope: "payments",
    };
  });

  app.post<{
    Body: {
      customer?: string;
      card?: { number?: string; expMonth?: number; expYear?: number; cvc?: string };
    };
  }>("/v1/payment-methods", { preHandler: serviceAuth }, async (request, reply) => {
    const customer = text(request.body?.customer);
    if (!customer) {
      return reply.code(400).send({ error: "customer is required." });
    }
    const card = request.body?.card;
    const validated = processor.validateCard({
      number: text(card?.number),
      expMonth: Number(card?.expMonth),
      expYear: Number(card?.expYear),
      cvc: text(card?.cvc),
    });
    if ("error" in validated) {
      return reply.code(400).send({ error: validated.error });
    }

    const id = newId("pm");
    const inserted = await pool.query<{
      id: string;
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
      fingerprint: string;
      created_at: Date;
    }>(
      `insert into payment_methods (
         id, customer_ref, brand, last4, exp_month, exp_year, fingerprint, test_card_key
       ) values ($1, $2::uuid, $3, $4, $5, $6, $7, $8)
       returning id, brand, last4, exp_month, exp_year, fingerprint, created_at`,
      [
        id,
        customer,
        validated.brand,
        validated.last4,
        validated.expMonth,
        validated.expYear,
        validated.fingerprint,
        validated.testCardKey,
      ],
    );
    return reply.code(201).send(publicMethod(inserted.rows[0]!));
  });

  app.get<{ Querystring: { customer?: string } }>(
    "/v1/payment-methods",
    { preHandler: serviceAuth },
    async (request, reply) => {
      const customer = text(request.query.customer);
      if (!customer) {
        return reply.code(400).send({ error: "customer query is required." });
      }
      const list = await pool.query<{
        id: string;
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
        fingerprint: string;
        created_at: Date;
      }>(
        `select id, brand, last4, exp_month, exp_year, fingerprint, created_at
         from payment_methods
         where customer_ref = $1::uuid and detached_at is null
         order by created_at desc`,
        [customer],
      );
      return { data: list.rows.map(publicMethod) };
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/v1/payment-methods/:id",
    { preHandler: serviceAuth },
    async (request, reply) => {
      const result = await pool.query(
        `update payment_methods
         set detached_at = now()
         where id = $1 and detached_at is null
         returning id`,
        [request.params.id],
      );
      if (!result.rows[0]) {
        return reply.code(404).send({ error: "Payment method not found." });
      }
      return { id: request.params.id, deleted: true };
    },
  );

  app.post<{
    Body: {
      amount?: number;
      currency?: string;
      customer?: string;
      payment_method?: string;
      confirm?: boolean;
      metadata?: { orderNumber?: string };
    };
  }>("/v1/payment-intents", { preHandler: serviceAuth }, async (request, reply) => {
    const amount = Number(request.body?.amount);
    const currency = text(request.body?.currency) || "usd";
    const customer = text(request.body?.customer);
    const paymentMethodId = text(request.body?.payment_method);
    const confirm = Boolean(request.body?.confirm);
    const orderNumber = text(request.body?.metadata?.orderNumber) || null;

    if (!Number.isInteger(amount) || amount < 0) {
      return reply.code(400).send({ error: "amount must be a non-negative integer (cents)." });
    }
    if (!customer) {
      return reply.code(400).send({ error: "customer is required." });
    }
    if (!paymentMethodId) {
      return reply.code(400).send({ error: "payment_method is required." });
    }

    const method = await pool.query<{
      id: string;
      customer_ref: string;
      brand: string;
      last4: string;
      test_card_key: string;
      detached_at: Date | null;
    }>(
      `select id, customer_ref::text, brand, last4, test_card_key, detached_at
       from payment_methods where id = $1`,
      [paymentMethodId],
    );
    const pm = method.rows[0];
    if (!pm || pm.detached_at) {
      return reply.code(404).send({ error: "Payment method not found." });
    }
    if (pm.customer_ref !== customer) {
      return reply.code(400).send({ error: "Payment method does not belong to this customer." });
    }

    const id = newId("pi");
    let status: string = confirm ? "requires_confirmation" : "requires_confirmation";
    let declineCode: string | null = null;
    let confirmedAt: Date | null = null;

    if (confirm) {
      const charge = processor.charge(pm.test_card_key as TestCardKey);
      if (charge.ok) {
        status = "succeeded";
        confirmedAt = new Date();
      } else {
        status = "requires_payment_method";
        declineCode = charge.declineCode;
        await pool.query(
          `insert into payment_intents (
             id, customer_ref, amount_cents, currency, status, payment_method_id, order_number, decline_code
           ) values ($1, $2::uuid, $3, $4, $5, $6, $7, $8)`,
          [id, customer, amount, currency, status, paymentMethodId, orderNumber, declineCode],
        );
        return reply.code(402).send({
          error: charge.message,
          declineCode: charge.declineCode,
          paymentIntent: {
            id,
            object: "payment_intent",
            amount,
            currency,
            status,
            paymentMethodId,
            declineCode,
          },
        });
      }
    }

    await pool.query(
      `insert into payment_intents (
         id, customer_ref, amount_cents, currency, status, payment_method_id, order_number, decline_code, confirmed_at
       ) values ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        customer,
        amount,
        currency,
        status,
        paymentMethodId,
        orderNumber,
        declineCode,
        confirmedAt,
      ],
    );

    return reply.code(201).send({
      id,
      object: "payment_intent",
      amount,
      currency,
      status,
      paymentMethodId,
      card: { brand: pm.brand, last4: pm.last4 },
      orderNumber,
    });
  });

  app.get<{ Params: { id: string } }>(
    "/v1/payment-intents/:id",
    { preHandler: serviceAuth },
    async (request, reply) => {
      const result = await pool.query<{
        id: string;
        amount_cents: number;
        currency: string;
        status: string;
        payment_method_id: string | null;
        order_number: string | null;
        decline_code: string | null;
        created_at: Date;
        confirmed_at: Date | null;
      }>(
        `select id, amount_cents, currency, status, payment_method_id, order_number, decline_code,
                created_at, confirmed_at
         from payment_intents where id = $1`,
        [request.params.id],
      );
      const row = result.rows[0];
      if (!row) {
        return reply.code(404).send({ error: "Payment intent not found." });
      }
      return {
        id: row.id,
        object: "payment_intent",
        amount: row.amount_cents,
        currency: row.currency,
        status: row.status,
        paymentMethodId: row.payment_method_id,
        orderNumber: row.order_number,
        declineCode: row.decline_code,
        createdAt: row.created_at,
        confirmedAt: row.confirmed_at,
      };
    },
  );
}
