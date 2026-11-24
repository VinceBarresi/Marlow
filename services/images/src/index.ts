import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import pg from "pg";
import { registerImages } from "./routes.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});

const clientId = process.env.IMAGES_CLIENT_ID ?? "marlow-api";
const clientSecret = process.env.IMAGES_CLIENT_SECRET ?? "marlow-images-dev-secret";
const tokenSecret = process.env.IMAGES_TOKEN_SECRET ?? "marlow-images-token-dev";
const dataDir =
  process.env.IMAGES_DATA_DIR ??
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");

await mkdir(dataDir, { recursive: true });

const app = Fastify({ logger: true });
await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

app.get("/health", async () => {
  await pool.query("select 1");
  return { ok: true, service: "images", postgres: true };
});

await registerImages(app, {
  pool,
  dataDir,
  auth: { tokenSecret },
  clientId,
  clientSecret,
});

const port = Number(process.env.PORT ?? 4006);
const host = process.env.LISTEN_HOST ?? "127.0.0.1";
await app.listen({ port, host });
