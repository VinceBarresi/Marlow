export type ResponseMeta = {
  path: string;
  status: number;
  ms: number;
  cache: string | null;
  bytes: number;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const started = performance.now();
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers,
  });
  const text = await response.text();
  window.dispatchEvent(
    new CustomEvent<ResponseMeta>("marlow-response", {
      detail: {
        path,
        status: response.status,
        ms: Math.round(performance.now() - started),
        cache: response.headers.get("x-cache"),
        bytes: text.length,
      },
    }),
  );
  const data = text ? (JSON.parse(text) as { error?: string }) : null;
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? response.statusText);
  }
  return data as T;
}
