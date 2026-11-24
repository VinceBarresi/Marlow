import Fastify from "fastify";
import Redis from "ioredis";
import pg from "pg";
import { registerOrders } from "./routes.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const app = Fastify({ logger: true });

app.get("/health", async () => {
  await pool.query("select 1");
  const pong = await redis.ping();
  return { ok: true, service: "orders", postgres: true, redis: pong === "PONG" };
});

await registerOrders(app, { pool, redis });

const port = Number(process.env.PORT ?? 4002);
const host = process.env.LISTEN_HOST ?? "127.0.0.1";
await app.listen({ port, host });
