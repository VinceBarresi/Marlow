const imagesUrl = process.env.IMAGES_URL ?? "http://127.0.0.1:4006";
const clientId = process.env.IMAGES_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.IMAGES_CLIENT_SECRET ?? "marlow-images-dev-secret";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let cache: TokenCache | null = null;

async function fetchServiceToken() {
  const response = await fetch(new URL("/oauth/token", imagesUrl), {
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
    throw new Error(`Images OAuth failed (${response.status}): ${body}`);
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

async function imagesFetch(pathname: string, init: RequestInit = {}) {
  const token = await serviceToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  let response = await fetch(new URL(pathname, imagesUrl), { ...init, headers });
  if (response.status === 401) {
    cache = null;
    const retryToken = await serviceToken();
    headers.set("authorization", `Bearer ${retryToken}`);
    response = await fetch(new URL(pathname, imagesUrl), { ...init, headers });
  }
  return response;
}

export type ImageObject = {
  id: string;
  sku: string;
  contentType: string;
  byteSize: number;
  isPrimary: boolean;
  imageUrl: string;
};

export async function uploadProductImage(input: {
  sku: string;
  buffer: Buffer;
  filename: string;
  contentType: string;
  primary?: boolean;
}) {
  const form = new FormData();
  form.set("sku", input.sku);
  form.set("primary", input.primary === false ? "false" : "true");
  form.set(
    "file",
    new Blob([new Uint8Array(input.buffer)], { type: input.contentType }),
    input.filename || "image.bin",
  );
  const response = await imagesFetch("/v1/objects", { method: "POST", body: form });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Image upload failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as ImageObject;
}

export async function deleteProductImage(id: string) {
  const response = await imagesFetch(`/v1/objects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const body = await response.json();
  if (!response.ok) {
    const error = typeof body?.error === "string" ? body.error : "Image delete failed.";
    throw Object.assign(new Error(error), { status: response.status, body });
  }
  return body as { id: string; deleted: boolean };
}

export async function fetchImageBytes(id: string) {
  const response = await fetch(new URL(`/v1/objects/${encodeURIComponent(id)}`, imagesUrl));
  if (!response.ok) {
    const text = await response.text();
    let message = "Image not found.";
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? message;
    } catch {
      /* keep default */
    }
    throw Object.assign(new Error(message), { status: response.status });
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

export function imagesUnavailableError(error: unknown) {
  if (error instanceof TypeError) {
    return { status: 502, body: { error: "Images service is unavailable." } };
  }
  const status =
    typeof (error as { status?: number }).status === "number"
      ? (error as { status: number }).status
      : 502;
  const message = error instanceof Error ? error.message : "Images service request failed.";
  return { status, body: { error: message } };
}
