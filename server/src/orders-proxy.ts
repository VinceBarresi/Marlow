import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

const ordersUrl = process.env.ORDERS_URL ?? "http://127.0.0.1:4002";

export async function registerOrdersProxy(
  app: FastifyInstance,
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>,
) {
  async function proxy(request: FastifyRequest, reply: FastifyReply, pathname: string) {
    const user = await requireUser(request, reply);
    if (!user) return;

    const target = new URL(pathname, ordersUrl);
    target.search = new URL(request.url, "http://127.0.0.1").search;
    const headers: Record<string, string> = {
      "x-datalab-user": user.id,
      "x-datalab-role": user.role,
      "x-datalab-email": user.email,
    };
    const init: RequestInit = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(request.body ?? {});
    }

    let response: Response;
    try {
      response = await fetch(target, init);
    } catch {
      return reply.code(502).send({ error: "Orders service is unavailable." });
    }

    const body = await response.text();
    return reply
      .code(response.status)
      .type(response.headers.get("content-type") ?? "application/json")
      .send(body);
  }

  app.get("/api/cart", (request, reply) => proxy(request, reply, "/cart"));
  app.put("/api/cart/items", (request, reply) => proxy(request, reply, "/cart/items"));
  app.delete<{ Params: { sku: string } }>("/api/cart/items/:sku", (request, reply) =>
    proxy(request, reply, `/cart/items/${encodeURIComponent(request.params.sku)}`),
  );
  // Checkout is owned by the payments gateway (charge, then place order).
  app.get("/api/orders", (request, reply) => proxy(request, reply, "/orders"));
  app.get<{ Params: { number: string } }>("/api/orders/:number", (request, reply) =>
    proxy(request, reply, `/orders/${encodeURIComponent(request.params.number)}`),
  );
  app.post<{ Params: { number: string } }>("/api/orders/:number/cancel", (request, reply) =>
    proxy(request, reply, `/orders/${encodeURIComponent(request.params.number)}/cancel`),
  );
}
