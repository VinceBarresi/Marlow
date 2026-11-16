import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";
import { pageQuery, useCache } from "./query.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff";
};

type Deps = {
  pool: pg.Pool;
  redis: Redis;
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

const CACHE_TTL_SECONDS = 60;

export async function registerCatalog(app: FastifyInstance, { pool, redis, requireUser }: Deps) {
  async function cached<T>(
    reply: FastifyReply,
    key: string,
    enabled: boolean,
    load: () => Promise<T>,
  ) {
    const version = (await redis.get("cache:version")) ?? "0";
    const cacheKey = `cache:${version}:${key}`;
    if (!enabled) {
      reply.header("X-Cache", "BYPASS");
      return load();
    }
    const hit = await redis.get(cacheKey);
    if (hit) {
      reply.header("X-Cache", "HIT");
      return JSON.parse(hit) as T;
    }
    const value = await load();
    await redis.set(cacheKey, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
    reply.header("X-Cache", "MISS");
    return value;
  }

  app.get<{
    Querystring: {
      q?: string;
      lowStock?: string;
      page?: string;
      pageSize?: string;
      useCache?: string;
    };
  }>("/api/inventory", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });

    const q = request.query.q?.trim() || null;
    const lowStock = request.query.lowStock === "true";
    const { page, pageSize, offset } = pageQuery(request.query);
    const cacheKey = `inventory:${q ?? ""}:${lowStock}:${page}:${pageSize}`;

    return cached(reply, cacheKey, useCache(request.query.useCache), async () => {
      const filters = [q, lowStock];
      const where = `
          where ($1::text is null or p.name ilike '%' || $1 || '%' or p.sku ilike '%' || $1 || '%' or p.category = $1)
            and ($2::boolean is false or (i.on_hand - i.reserved) <= i.reorder_point)
        `;
      const list = await pool.query(
        `select p.sku, p.name, p.category, p.price_cents,
                  i.on_hand, i.reserved, i.on_hand - i.reserved as available,
                  i.reorder_point, i.bin, i.updated_at
           from inventory i
           join products p on p.sku = i.sku
           ${where}
           order by p.sku
           limit $3 offset $4`,
        [...filters, pageSize, offset],
      );
      const count = await pool.query<{ total: number }>(
        `select count(*)::int as total
           from inventory i
           join products p on p.sku = i.sku
           ${where}`,
        filters,
      );
      return {
        inventory: list.rows.map((row) => ({
          sku: row.sku,
          name: row.name,
          category: row.category,
          priceCents: row.price_cents,
          onHand: row.on_hand,
          reserved: row.reserved,
          available: row.available,
          reorderPoint: row.reorder_point,
          bin: row.bin,
          updatedAt: row.updated_at,
        })),
        page,
        pageSize,
        total: count.rows[0]?.total ?? 0,
      };
    });
  });
}
