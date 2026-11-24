import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";
import { pageQuery, useCache } from "./query.js";

type Deps = {
  pool: pg.Pool;
  redis: Redis;
};

type ProductRow = {
  sku: string;
  name: string;
  category: string;
  description: string;
  price_cents: number;
  on_hand: number;
  reserved: number;
  available: number;
  image_id: string | null;
};

function productJson(row: ProductRow) {
  return {
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    priceCents: row.price_cents,
    onHand: row.on_hand,
    reserved: row.reserved,
    available: row.available,
    imageId: row.image_id,
    imageUrl: row.image_id ? `/api/images/${row.image_id}` : null,
  };
}

const CACHE_TTL_SECONDS = 60;

export async function registerCatalog(app: FastifyInstance, { pool, redis }: Deps) {
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

  function requireCaller(request: FastifyRequest, reply: FastifyReply) {
    const user = request.headers["x-datalab-user"];
    if (typeof user !== "string" || user.length === 0) {
      reply.code(401).send({ error: "Sign in required." });
      return false;
    }
    return true;
  }

  app.get<{
    Querystring: {
      q?: string;
      category?: string;
      page?: string;
      pageSize?: string;
      useCache?: string;
    };
  }>("/products", async (request, reply) => {
    if (!requireCaller(request, reply)) return;

    const q = request.query.q?.trim() || null;
    const category = request.query.category?.trim() || null;
    const { page, pageSize, offset } = pageQuery(request.query);
    const cacheKey = `products:${category ?? ""}:${q ?? ""}:${page}:${pageSize}`;

    return cached(reply, cacheKey, useCache(request.query.useCache), async () => {
      const filters = [category, q];
      const where = `
        where ($1::text is null or p.category = $1)
          and ($2::text is null or p.name ilike '%' || $2 || '%' or p.sku ilike '%' || $2 || '%')
      `;
      const list = await pool.query<ProductRow>(
        `select p.sku, p.name, p.category, p.description, p.price_cents,
                i.on_hand, i.reserved, i.on_hand - i.reserved as available,
                img.id as image_id
         from products p
         join inventory i on i.sku = p.sku
         left join product_images img on img.sku = p.sku and img.is_primary
         ${where}
         order by p.name
         limit $3 offset $4`,
        [...filters, pageSize, offset],
      );
      const count = await pool.query<{ total: number }>(
        `select count(*)::int as total from products p ${where}`,
        filters,
      );
      return {
        products: list.rows.map(productJson),
        page,
        pageSize,
        total: count.rows[0]?.total ?? 0,
      };
    });
  });

  app.get<{ Params: { sku: string } }>("/products/:sku", async (request, reply) => {
    if (!requireCaller(request, reply)) return;

    const result = await pool.query<ProductRow>(
      `select p.sku, p.name, p.category, p.description, p.price_cents,
              i.on_hand, i.reserved, i.on_hand - i.reserved as available,
              img.id as image_id
       from products p
       join inventory i on i.sku = p.sku
       left join product_images img on img.sku = p.sku and img.is_primary
       where p.sku = $1`,
      [request.params.sku],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "Product not found." });
    return { product: productJson(row) };
  });

  app.get<{ Querystring: { useCache?: string } }>("/categories", async (request, reply) => {
    if (!requireCaller(request, reply)) return;

    return cached(reply, "categories", useCache(request.query.useCache), async () => {
      const result = await pool.query<{ category: string; products: number }>(
        `select category, count(*)::int as products
         from products
         group by category
         order by category`,
      );
      return { categories: result.rows };
    });
  });
}
