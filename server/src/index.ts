import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import Redis from "ioredis";
import pg from "pg";
import { registerCareers } from "./careers.js";
import { registerCatalog } from "./catalog.js";
import { registerCatalogProxy } from "./catalog-proxy.js";
import { registerCommerce } from "./commerce.js";
import { registerLocations } from "./locations.js";
import { registerOrdersProxy } from "./orders-proxy.js";
import { verifyPassword } from "./passwords.js";
import { pageQuery } from "./query.js";
import { listPaymentMethods } from "./payments-client.js";
import { registerPaymentsGateway } from "./payments.js";
import { registerShippingGateway } from "./shipping.js";

const WEEK = 60 * 60 * 24 * 7;
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

const app = Fastify({ logger: true });
await app.register(cookie);
await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

async function sessionUser(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  const raw = await redis.get(`session:${cookieValue}`);
  if (!raw) return null;
  return JSON.parse(raw) as SessionUser;
}

app.get("/api/health", async () => {
  await pool.query("select 1");
  const pong = await redis.ping();
  return { ok: true, postgres: true, redis: pong === "PONG" };
});

app.post<{ Body: { email?: string; password?: string } }>("/api/login", async (request, reply) => {
  const email = request.body?.email?.trim().toLowerCase();
  const password = request.body?.password ?? "";
  if (!email || !password) {
    return reply.code(400).send({ error: "Enter an email and password." });
  }

  const result = await pool.query<SessionUser & { password_hash: string }>(
    "select id, email, name, role, password_hash from users where email = $1",
    [email],
  );
  const row = result.rows[0];
  const valid = row ? await verifyPassword(password, row.password_hash) : false;
  if (!row || !valid) {
    return reply.code(401).send({ error: "Email or password is wrong." });
  }

  const sid = randomBytes(32).toString("hex");
  const user: SessionUser = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
  await redis.set(`session:${sid}`, JSON.stringify(user), "EX", WEEK);
  reply.setCookie("datalab_session", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
  return { user };
});

app.post("/api/logout", async (request, reply) => {
  const sid = request.cookies.datalab_session;
  if (sid) await redis.del(`session:${sid}`);
  reply.clearCookie("datalab_session", { path: "/" });
  return { ok: true };
});

async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const user = await sessionUser(request.cookies.datalab_session);
  if (!user) {
    reply.code(401).send({ error: "Sign in required." });
    return null;
  }
  return user;
}

app.get("/api/me", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  return { user };
});

const customerWhere = `u.role = 'customer' and ($1::text is null or u.name ilike '%' || $1 || '%' or u.email ilike '%' || $1 || '%')`;

app.get<{ Querystring: { q?: string; page?: string; pageSize?: string } }>(
  "/api/customers",
  async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });

    const q = request.query.q?.trim() || null;
    const { page, pageSize, offset } = pageQuery({
      page: request.query.page,
      pageSize: request.query.pageSize ?? "25",
    });
    const list = await pool.query<{
      id: string;
      email: string;
      name: string;
      created_at: Date;
      orders: number;
      spent_cents: number;
    }>(
      `select u.id, u.email, u.name, u.created_at,
              count(o.id)::int as orders,
              coalesce(sum(o.total_cents), 0)::int as spent_cents
       from users u
       left join orders o on o.user_id = u.id
       where ${customerWhere}
       group by u.id
       order by u.name
       limit $2 offset $3`,
      [q, pageSize, offset],
    );
    const count = await pool.query<{ total: number }>(
      `select count(*)::int as total from users u where ${customerWhere}`,
      [q],
    );
    return {
      customers: list.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        createdAt: row.created_at,
        orders: row.orders,
        spentCents: row.spent_cents,
      })),
      page,
      pageSize,
      total: count.rows[0]?.total ?? 0,
    };
  },
);

app.get<{ Params: { id: string } }>("/api/customers/:id", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.params.id)) {
    return reply.code(404).send({ error: "Customer not found." });
  }

  const customer = await pool.query<{ id: string; email: string; name: string; created_at: Date }>(
    `select id, email, name, created_at from users where id = $1 and role = 'customer'`,
    [request.params.id],
  );
  const row = customer.rows[0];
  if (!row) return reply.code(404).send({ error: "Customer not found." });

  const orders = await pool.query<{
    number: string;
    status: string;
    placed_at: Date;
    total_cents: number;
    ship_city: string;
    ship_region: string;
    line_count: number;
  }>(
    `select o.number, o.status, o.placed_at, o.total_cents, o.ship_city, o.ship_region,
            (select count(*)::int from order_lines l where l.order_id = o.id) as line_count
     from orders o
     where o.user_id = $1
     order by o.placed_at desc`,
    [row.id],
  );

  // Tokenized cards only (brand / last4 / exp) — never PAN or CVC.
  let paymentMethods: Array<{
    id: string;
    card: { brand: string; last4: string; expMonth: number; expYear: number };
  }> = [];
  try {
    const methods = await listPaymentMethods(row.id);
    paymentMethods = methods.data.map((method) => ({
      id: method.id,
      card: {
        brand: method.card.brand,
        last4: method.card.last4,
        expMonth: method.card.expMonth,
        expYear: method.card.expYear,
      },
    }));
  } catch {
    paymentMethods = [];
  }

  return {
    customer: {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
    },
    paymentMethods,
    orders: orders.rows.map((order) => ({
      number: order.number,
      status: order.status,
      placedAt: order.placed_at,
      totalCents: order.total_cents,
      shipCity: order.ship_city,
      shipRegion: order.ship_region,
      lineCount: order.line_count,
    })),
  };
});

await registerCatalogProxy(app, requireUser);
await registerCatalog(app, { pool, redis, requireUser });
await registerOrdersProxy(app, requireUser);
await registerLocations(app, { pool, requireUser });
await registerCareers(app, { pool, requireUser });
await registerCommerce(app, { pool, redis, requireUser });
await registerShippingGateway(app, { requireUser });
await registerPaymentsGateway(app, { requireUser });

await app.register(swagger, {
  mode: "static",
  specification: {
    path: fileURLToPath(new URL("../openapi.json", import.meta.url)),
  },
});
await app.register(swaggerUi, { routePrefix: "/docs" });

const port = Number(process.env.PORT ?? 4000);
const host = process.env.LISTEN_HOST ?? "127.0.0.1";
await app.listen({ port, host });
