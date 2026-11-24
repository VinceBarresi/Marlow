const shippingUrl = process.env.SHIPPING_URL ?? "http://127.0.0.1:4004";
const clientId = process.env.SHIPPING_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.SHIPPING_CLIENT_SECRET ?? "marlow-shipping-dev-secret";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let cache: TokenCache | null = null;

async function fetchServiceToken() {
  const response = await fetch(new URL("/oauth/token", shippingUrl), {
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
    throw new Error(`Shipping OAuth failed (${response.status}): ${body}`);
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

async function shippingFetch(pathname: string, init: RequestInit = {}) {
  const token = await serviceToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  let response = await fetch(new URL(pathname, shippingUrl), { ...init, headers });
  if (response.status === 401) {
    cache = null;
    const retryToken = await serviceToken();
    headers.set("authorization", `Bearer ${retryToken}`);
    response = await fetch(new URL(pathname, shippingUrl), { ...init, headers });
  }
  return response;
}

export type ShippingCreateResult = {
  id: string;
  orderId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  status: string;
};

export type ShippingTrackResult = {
  trackingNumber: string;
  carrier: string;
  service: string;
  status: string;
  shippedAt: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  orderId: string;
  scans: Array<{
    status: string;
    location: string;
    message: string;
    happenedAt: string;
  }>;
};

export async function createShipment(input: {
  orderId: string;
  carrier: string;
  service: string;
  shipCity: string;
  shipRegion: string;
}) {
  const response = await shippingFetch("/shipments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Shipping create failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as ShippingCreateResult;
}

export async function trackShipment(trackingNumber: string, bearerToken?: string) {
  const headers: Record<string, string> = {};
  if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;
  const response = bearerToken
    ? await fetch(new URL(`/track/${encodeURIComponent(trackingNumber)}`, shippingUrl), {
        headers,
      })
    : await shippingFetch(`/track/${encodeURIComponent(trackingNumber)}`);
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Tracking lookup failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as ShippingTrackResult;
}

export async function addShipmentEvent(
  trackingNumber: string,
  input: { status: string; location: string; message: string; shipmentStatus?: string },
) {
  const response = await shippingFetch(`/shipments/${encodeURIComponent(trackingNumber)}/events`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Shipping event failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { ok: true; trackingNumber: string };
}

export async function updateTrackingNumber(current: string, next: string) {
  const response = await shippingFetch(`/shipments/${encodeURIComponent(current)}`, {
    method: "PATCH",
    body: JSON.stringify({ trackingNumber: next }),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Tracking update failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { ok: true; trackingNumber: string };
}

export async function mintUserTrackingToken(userId: string, role: string) {
  const response = await shippingFetch("/oauth/user-token", {
    method: "POST",
    body: JSON.stringify({ userId, role }),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Could not mint shipping token.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { access_token: string; token_type: string; expires_in: number };
}

export function shippingUnavailableError(error: unknown) {
  if (error instanceof TypeError) {
    return { status: 502, body: { error: "Shipping service is unavailable." } };
  }
  const status =
    typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 502;
  const message = error instanceof Error ? error.message : "Shipping service request failed.";
  return { status, body: { error: message } };
}
