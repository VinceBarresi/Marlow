import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import Redis from "ioredis";
import pg from "pg";
import { registerCatalog } from "./catalog.js";
import { registerCatalogProxy } from "./catalog-proxy.js";
import { registerCommerce } from "./commerce.js";
import { registerOrdersProxy } from "./orders-proxy.js";
import { verifyPassword } from "./passwords.js";

const WEEK = 60 * 60 * 24 * 7;
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff";
};

const app = Fastify({ logger: true });
await app.register(cookie);

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

await registerCatalogProxy(app, requireUser);
await registerCatalog(app, { pool, redis, requireUser });
await registerOrdersProxy(app, requireUser);
await registerCommerce(app, { pool, redis, requireUser });

await app.register(swagger, {
  mode: "static",
  specification: {
    path: fileURLToPath(new URL("../openapi.json", import.meta.url)),
  },
});
await app.register(swaggerUi, { routePrefix: "/docs" });

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "127.0.0.1" });
