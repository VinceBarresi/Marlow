import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  deleteProductImage,
  fetchImageBytes,
  imagesUnavailableError,
  uploadProductImage,
} from "./images-client.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

function isStaff(role: SessionUser["role"]) {
  return role === "staff" || role === "admin";
}

export async function registerImagesGateway(app: FastifyInstance, { requireUser }: Deps) {
  app.get<{ Params: { id: string } }>("/api/images/:id", async (request, reply) => {
    try {
      const image = await fetchImageBytes(request.params.id);
      return reply
        .header("Content-Type", image.contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(image.buffer);
    } catch (error) {
      const failure = imagesUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });

  app.post<{ Params: { sku: string } }>("/api/products/:sku/image", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (!isStaff(user.role)) {
      return reply.code(403).send({ error: "Staff only." });
    }

    let fileBuffer: Buffer | null = null;
    let filename = "image.bin";
    let contentType = "application/octet-stream";
    try {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "Upload an image file." });
      }
      filename = file.filename || filename;
      contentType = file.mimetype || contentType;
      const chunks: Buffer[] = [];
      for await (const chunk of file.file) chunks.push(chunk);
      fileBuffer = Buffer.concat(chunks);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : "";
      if (code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(400).send({ error: "Image must be 5 MB or smaller." });
      }
      throw error;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.code(400).send({ error: "Upload an image file." });
    }

    try {
      const image = await uploadProductImage({
        sku: request.params.sku,
        buffer: fileBuffer,
        filename,
        contentType,
        primary: true,
      });
      return reply.code(201).send({ image });
    } catch (error) {
      const failure = imagesUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });

  app.delete<{ Params: { sku: string; id: string } }>(
    "/api/products/:sku/image/:id",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (!isStaff(user.role)) {
        return reply.code(403).send({ error: "Staff only." });
      }
      try {
        const result = await deleteProductImage(request.params.id);
        return result;
      } catch (error) {
        const failure = imagesUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }
    },
  );
}
