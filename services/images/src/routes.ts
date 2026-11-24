import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { requireBearer, type AuthConfig } from "./auth.js";
import {
  absolutePath,
  extensionFor,
  newObjectId,
  objectRelativePath,
  removeObjectFile,
  writeObjectFile,
} from "./storage.js";
import { signAccessToken } from "./token.js";

const SERVICE_TOKEN_TTL = 3600;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

type Deps = {
  pool: pg.Pool;
  dataDir: string;
  auth: AuthConfig;
  clientId: string;
  clientSecret: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function publicObject(row: {
  id: string;
  sku: string;
  content_type: string;
  byte_size: number;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    sku: row.sku,
    contentType: row.content_type,
    byteSize: row.byte_size,
    isPrimary: row.is_primary,
    imageUrl: `/api/images/${row.id}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function registerImages(app: FastifyInstance, deps: Deps) {
  const { pool, dataDir, auth, clientId, clientSecret } = deps;
  const serviceAuth = requireBearer(auth, ["images"]);

  app.post<{
    Body: {
      grant_type?: string;
      client_id?: string;
      client_secret?: string;
    };
  }>("/oauth/token", async (request, reply) => {
    const grant = text(request.body?.grant_type) || "client_credentials";
    if (grant !== "client_credentials") {
      return reply.code(400).send({ error: "Unsupported grant_type." });
    }
    const id = text(request.body?.client_id);
    const secret = text(request.body?.client_secret);
    if (id !== clientId || secret !== clientSecret) {
      return reply.code(401).send({ error: "Invalid client credentials." });
    }
    const accessToken = signAccessToken(
      { sub: `service:${id}`, scope: "images", typ: "service" },
      auth.tokenSecret,
      SERVICE_TOKEN_TTL,
    );
    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: SERVICE_TOKEN_TTL,
      scope: "images",
    };
  });

  app.get<{ Params: { id: string } }>("/v1/objects/:id", async (request, reply) => {
    const result = await pool.query<{
      id: string;
      content_type: string;
      relative_path: string;
      byte_size: number;
    }>(`select id, content_type, relative_path, byte_size from product_images where id = $1`, [
      request.params.id,
    ]);
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "Image not found." });
    const full = absolutePath(dataDir, row.relative_path);
    try {
      await access(full);
    } catch {
      return reply.code(404).send({ error: "Image file missing." });
    }
    reply
      .header("Content-Type", row.content_type)
      .header("Content-Length", String(row.byte_size))
      .header("Cache-Control", "public, max-age=86400");
    return reply.send(createReadStream(full));
  });

  app.get<{ Params: { sku: string } }>("/v1/skus/:sku", async (request) => {
    const list = await pool.query<{
      id: string;
      sku: string;
      content_type: string;
      byte_size: number;
      is_primary: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `select id, sku, content_type, byte_size, is_primary, created_at, updated_at
       from product_images
       where sku = $1
       order by is_primary desc, created_at desc`,
      [request.params.sku],
    );
    return { data: list.rows.map(publicObject) };
  });

  app.post("/v1/objects", { preHandler: serviceAuth }, async (request, reply) => {
    const parts = request.parts();
    let sku = "";
    let primary = true;
    let fileBuffer: Buffer | null = null;
    let contentType = "";
    let filename = "";

    for await (const part of parts) {
      if (part.type === "file") {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of part.file) {
          size += chunk.length;
          if (size > MAX_BYTES) {
            return reply.code(400).send({ error: "Image must be 5 MB or smaller." });
          }
          chunks.push(chunk);
        }
        fileBuffer = Buffer.concat(chunks);
        contentType = part.mimetype || "application/octet-stream";
        filename = part.filename || "";
      } else {
        const value = String(part.value ?? "").trim();
        if (part.fieldname === "sku") sku = value;
        if (part.fieldname === "primary") {
          primary = value === "true" || value === "1" || value === "";
        }
      }
    }

    if (!sku) return reply.code(400).send({ error: "sku is required." });
    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.code(400).send({ error: "file is required." });
    }
    if (!ALLOWED_TYPES.has(contentType)) {
      return reply.code(400).send({ error: "Upload a JPEG, PNG, WebP, GIF, or SVG image." });
    }

    const product = await pool.query(`select sku from products where sku = $1`, [sku]);
    if (!product.rows[0]) return reply.code(404).send({ error: "Product not found." });

    const id = newObjectId();
    const ext = extensionFor(contentType, filename);
    const relativePath = objectRelativePath(id, ext);
    await writeObjectFile(dataDir, relativePath, fileBuffer);

    const client = await pool.connect();
    try {
      await client.query("begin");
      if (primary) {
        const previous = await client.query<{ id: string; relative_path: string }>(
          `select id, relative_path from product_images where sku = $1 and is_primary`,
          [sku],
        );
        for (const row of previous.rows) {
          await client.query(`delete from product_images where id = $1`, [row.id]);
          await removeObjectFile(dataDir, row.relative_path);
        }
      }
      const inserted = await client.query<{
        id: string;
        sku: string;
        content_type: string;
        byte_size: number;
        is_primary: boolean;
        created_at: Date;
        updated_at: Date;
      }>(
        `insert into product_images (
           id, sku, content_type, relative_path, byte_size, is_primary
         ) values ($1, $2, $3, $4, $5, $6)
         returning id, sku, content_type, byte_size, is_primary, created_at, updated_at`,
        [
          id,
          sku,
          contentType === "image/jpg" ? "image/jpeg" : contentType,
          relativePath,
          fileBuffer.length,
          primary,
        ],
      );
      await client.query("commit");
      return reply.code(201).send(publicObject(inserted.rows[0]!));
    } catch (error) {
      await client.query("rollback");
      await removeObjectFile(dataDir, relativePath);
      throw error;
    } finally {
      client.release();
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/v1/objects/:id",
    { preHandler: serviceAuth },
    async (request, reply) => {
      const existing = await pool.query<{ id: string; relative_path: string }>(
        `select id, relative_path from product_images where id = $1`,
        [request.params.id],
      );
      const row = existing.rows[0];
      if (!row) return reply.code(404).send({ error: "Image not found." });
      await pool.query(`delete from product_images where id = $1`, [row.id]);
      await removeObjectFile(dataDir, row.relative_path);
      return { id: row.id, deleted: true };
    },
  );
}
