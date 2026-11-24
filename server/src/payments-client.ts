const paymentsUrl = process.env.PAYMENTS_URL ?? "http://127.0.0.1:4005";
const clientId = process.env.PAYMENTS_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.PAYMENTS_CLIENT_SECRET ?? "marlow-payments-dev-secret";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let cache: TokenCache | null = null;

async function fetchServiceToken() {
  const response = await fetch(new URL("/oauth/token", paymentsUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Payments OAuth failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + Math.max(30, json.expires_in - 60) * 1000,
  };
  return cache.accessToken;
}

async function serviceToken() {
  if (cache && cache.expiresAt > Date.now()) return cache.accessToken;
  return fetchServiceToken();
}

async function paymentsFetch(pathname: string, init: RequestInit = {}) {
  const token = await serviceToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  let response = await fetch(new URL(pathname, paymentsUrl), { ...init, headers });
  if (response.status === 401) {
    cache = null;
    const retryToken = await serviceToken();
    headers.set("authorization", `Bearer ${retryToken}`);
    response = await fetch(new URL(pathname, paymentsUrl), { ...init, headers });
  }
  return response;
}

export type PaymentMethod = {
  id: string;
  object: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    fingerprint: string;
  };
  createdAt: string;
};

export type PaymentIntent = {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodId: string;
  card?: { brand: string; last4: string };
  declineCode?: string | null;
  orderNumber?: string | null;
};

export async function createPaymentMethod(input: {
  customer: string;
  card: { number: string; expMonth: number; expYear: number; cvc: string };
}) {
  const response = await paymentsFetch("/v1/payment-methods", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Could not save card.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as PaymentMethod;
}

export async function listPaymentMethods(customer: string) {
  const response = await paymentsFetch(
    `/v1/payment-methods?customer=${encodeURIComponent(customer)}`,
  );
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Could not list cards.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { data: PaymentMethod[] };
}

export async function deletePaymentMethod(id: string) {
  const response = await paymentsFetch(`/v1/payment-methods/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Could not remove card.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { id: string; deleted: boolean };
}

export async function createPaymentIntent(input: {
  amount: number;
  currency?: string;
  customer: string;
  payment_method: string;
  confirm?: boolean;
  metadata?: { orderNumber?: string };
}) {
  const response = await paymentsFetch("/v1/payment-intents", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Payment failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as PaymentIntent;
}

export function paymentsUnavailableError(error: unknown) {
  if (error instanceof TypeError) {
    return { status: 502, body: { error: "Payments service is unavailable." } };
  }
  const status =
    typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 502;
  const message = error instanceof Error ? error.message : "Payments service request failed.";
  const declineCode = (error as { body?: { declineCode?: string } }).body?.declineCode;
  return {
    status,
    body: declineCode ? { error: message, declineCode } : { error: message },
  };
}
