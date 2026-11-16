import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

const catalogUrl = process.env.CATALOG_URL ?? "http://127.0.0.1:4001";

export async function registerCatalogProxy(
  app: FastifyInstance,
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>,
) {
  async function proxy(request: FastifyRequest, reply: FastifyReply, pathname: string) {
    const user = await requireUser(request, reply);
    if (!user) return;

    const target = new URL(pathname, catalogUrl);
    target.search = new URL(request.url, "http://127.0.0.1").search;

    let response: Response;
    try {
      response = await fetch(target, {
        headers: { "x-datalab-user": user.id, "x-datalab-role": user.role },
      });
    } catch {
      return reply.code(502).send({ error: "Catalog service is unavailable." });
    }

    const cache = response.headers.get("x-cache");
    if (cache) reply.header("X-Cache", cache);
    const body = await response.text();
    return reply
      .code(response.status)
      .type(response.headers.get("content-type") ?? "application/json")
      .send(body);
  }

  app.get("/api/products", (request, reply) => proxy(request, reply, "/products"));
  app.get<{ Params: { sku: string } }>("/api/products/:sku", (request, reply) =>
    proxy(request, reply, `/products/${encodeURIComponent(request.params.sku)}`),
  );
  app.get("/api/categories", (request, reply) => proxy(request, reply, "/categories"));
}
