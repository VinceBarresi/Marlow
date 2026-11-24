import Fastify from "fastify";
import pg from "pg";
import { MockFedExClient } from "./carrier.js";
import { registerShipping } from "./routes.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});

const clientId = process.env.SHIPPING_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.SHIPPING_CLIENT_SECRET ?? "marlow-shipping-dev-secret";
const tokenSecret = process.env.SHIPPING_TOKEN_SECRET ?? "marlow-shipping-token-dev";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  await pool.query("select 1");
  return { ok: true, service: "shipping", postgres: true };
});

await registerShipping(app, {
  pool,
  carrier: new MockFedExClient(),
  auth: { tokenSecret },
  clientId,
  clientSecret,
});

const port = Number(process.env.PORT ?? 4004);
const host = process.env.LISTEN_HOST ?? "127.0.0.1";
await app.listen({ port, host });
