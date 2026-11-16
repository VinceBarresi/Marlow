import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type pg from "pg";
import { pageQuery } from "./query.js";
import { deleteResumeFiles } from "./resumes.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  pool: pg.Pool;
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

type LocationRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  line1: string;
  region: string;
  postal_code: string;
  phone: string;
  hours: string;
  latitude: number;
  longitude: number;
  products_in_stock: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function coordinate(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}

function locationJson(row: LocationRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    line1: row.line1,
    region: row.region,
    postalCode: row.postal_code,
    phone: row.phone,
    hours: row.hours,
    latitude: row.latitude,
    longitude: row.longitude,
    productsInStock: row.products_in_stock,
  };
}

export async function registerLocations(app: FastifyInstance, { pool, requireUser }: Deps) {
  app.get("/api/locations", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const result = await pool.query<LocationRow>(
      `select l.id, l.slug, l.name, l.city, l.line1, l.region, l.postal_code, l.phone, l.hours,
              l.latitude, l.longitude,
              count(li.sku) filter (where li.on_hand > 0)::int as products_in_stock
       from locations l
       left join location_inventory li on li.location_id = l.id
       group by l.id
       order by l.city, l.name`,
    );
    return { locations: result.rows.map(locationJson) };
  });

  app.get<{
    Params: { slug: string };
    Querystring: { q?: string; category?: string; page?: string; pageSize?: string };
  }>("/api/locations/:slug", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const found = await pool.query<LocationRow>(
      `select l.id, l.slug, l.name, l.city, l.line1, l.region, l.postal_code, l.phone, l.hours,
              l.latitude, l.longitude,
              count(li.sku) filter (where li.on_hand > 0)::int as products_in_stock
       from locations l
       left join location_inventory li on li.location_id = l.id
       where l.slug = $1
       group by l.id`,
      [request.params.slug],
    );
    const location = found.rows[0];
    if (!location) return reply.code(404).send({ error: "Location not found." });

    const q = request.query.q?.trim() || null;
    const category = request.query.category?.trim() || null;
    const { page, pageSize, offset } = pageQuery({
      page: request.query.page,
      pageSize: request.query.pageSize ?? "24",
    });
    const categories = await pool.query<{ category: string; products: number }>(
      `select p.category, count(*)::int as products
       from location_inventory li
       join products p on p.sku = li.sku
       where li.location_id = $1 and li.on_hand > 0
       group by p.category
       order by p.category`,
      [location.id],
    );
    const filters = [location.id, q, category];
    const where = `
      where li.location_id = $1
        and li.on_hand > 0
        and ($2::text is null or p.name ilike '%' || $2 || '%' or p.sku ilike '%' || $2 || '%')
        and ($3::text is null or p.category = $3)
    `;
    const list = await pool.query<{
      sku: string;
      name: string;
      category: string;
      price_cents: number;
      on_hand: number;
    }>(
      `select p.sku, p.name, p.category, p.price_cents, li.on_hand
       from location_inventory li
       join products p on p.sku = li.sku
       ${where}
       order by p.name
       limit $4 offset $5`,
      [...filters, pageSize, offset],
    );
    const count = await pool.query<{ total: number }>(
      `select count(*)::int as total
       from location_inventory li
       join products p on p.sku = li.sku
       ${where}`,
      filters,
    );
    return {
      location: locationJson(location),
      categories: categories.rows,
      products: list.rows.map((row) => ({
        sku: row.sku,
        name: row.name,
        category: row.category,
        priceCents: row.price_cents,
        onHand: row.on_hand,
      })),
      page,
      pageSize,
      total: count.rows[0]?.total ?? 0,
    };
  });

  app.post<{ Body: Record<string, unknown> }>("/api/locations", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "admin") return reply.code(403).send({ error: "Admin only." });

    const name = text(request.body.name);
    const city = text(request.body.city);
    const line1 = text(request.body.line1);
    const region = text(request.body.region);
    const postalCode = text(request.body.postalCode);
    const phone = text(request.body.phone);
    const hours = text(request.body.hours);
    const latitude = coordinate(request.body.latitude, -90, 90);
    const longitude = coordinate(request.body.longitude, -180, 180);
    const slug = slugify(name);
    if (!slug || !city || !line1 || !region || !postalCode || !phone || !hours) {
      return reply.code(400).send({ error: "Name, address, phone, and hours are required." });
    }
    if (latitude === null || longitude === null) {
      return reply.code(400).send({ error: "Latitude and longitude are required." });
    }
    const taken = await pool.query(`select 1 from locations where slug = $1`, [slug]);
    if (taken.rowCount)
      return reply.code(409).send({ error: "A store with that name already exists." });

    const id = randomUUID();
    await pool.query(
      `insert into locations (id, slug, name, city, line1, region, postal_code, phone, hours, latitude, longitude)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, slug, name, city, line1, region, postalCode, phone, hours, latitude, longitude],
    );
    const created = await pool.query<LocationRow>(
      `select l.id, l.slug, l.name, l.city, l.line1, l.region, l.postal_code, l.phone, l.hours,
              l.latitude, l.longitude, 0::int as products_in_stock
       from locations l
       where l.id = $1`,
      [id],
    );
    const row = created.rows[0];
    if (!row) return reply.code(500).send({ error: "Store was not saved." });
    return reply.code(201).send({ location: locationJson(row) });
  });

  app.delete<{ Params: { slug: string } }>("/api/locations/:slug", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "admin") return reply.code(403).send({ error: "Admin only." });

    const client = await pool.connect();
    try {
      await client.query("begin");
      const found = await client.query<{ id: string }>(`select id from locations where slug = $1`, [
        request.params.slug,
      ]);
      const id = found.rows[0]?.id;
      if (!id) {
        await client.query("rollback");
        return reply.code(404).send({ error: "Location not found." });
      }
      const orders = await client.query<{ total: number }>(
        `select count(*)::int as total from orders where location_id = $1`,
        [id],
      );
      if ((orders.rows[0]?.total ?? 0) > 0) {
        await client.query("rollback");
        return reply.code(409).send({ error: "This store has orders, so it stays." });
      }
      const resumes = await client.query<{ resume_filename: string }>(
        `delete from applications
         where job_id in (select id from jobs where location_id = $1)
         returning resume_filename`,
        [id],
      );
      await client.query(`delete from jobs where location_id = $1`, [id]);
      await client.query(`delete from location_inventory where location_id = $1`, [id]);
      await client.query(`delete from locations where id = $1`, [id]);
      await client.query("commit");
      await deleteResumeFiles(resumes.rows.map((row) => row.resume_filename));
      return reply.code(204).send();
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });
}
