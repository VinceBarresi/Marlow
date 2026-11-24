import Fastify from "fastify";
import pg from "pg";
import { MockStripeClient } from "./processor.js";
import { registerPayments } from "./routes.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});

const clientId = process.env.PAYMENTS_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.PAYMENTS_CLIENT_SECRET ?? "marlow-payments-dev-secret";
const tokenSecret = process.env.PAYMENTS_TOKEN_SECRET ?? "marlow-payments-token-dev";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  await pool.query("select 1");
  return { ok: true, service: "payments", postgres: true };
});

await registerPayments(app, {
  pool,
  processor: new MockStripeClient(),
  auth: { tokenSecret },
  clientId,
  clientSecret,
});

const port = Number(process.env.PORT ?? 4005);
const host = process.env.LISTEN_HOST ?? "127.0.0.1";
await app.listen({ port, host });
