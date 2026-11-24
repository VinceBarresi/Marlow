import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  mintUserTrackingToken,
  shippingUnavailableError,
  trackShipment,
} from "./shipping-client.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

function bearerFromRequest(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function registerShippingGateway(app: FastifyInstance, { requireUser }: Deps) {
  app.post("/api/shipping/access-token", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    try {
      const token = await mintUserTrackingToken(user.id, user.role);
      return {
        accessToken: token.access_token,
        tokenType: token.token_type,
        expiresIn: token.expires_in,
      };
    } catch (error) {
      const failure = shippingUnavailableError(error);
      return reply.code(failure.status).send(failure.body);
    }
  });

  app.get<{ Params: { trackingNumber: string } }>(
    "/api/tracking/:trackingNumber",
    async (request, reply) => {
      let bearer = bearerFromRequest(request);
      if (!bearer) {
        const user = await requireUser(request, reply);
        if (!user) return;
        try {
          const token = await mintUserTrackingToken(user.id, user.role);
          bearer = token.access_token;
        } catch (error) {
          const failure = shippingUnavailableError(error);
          return reply.code(failure.status).send(failure.body);
        }
      }

      try {
        const tracking = await trackShipment(request.params.trackingNumber, bearer);
        return { tracking };
      } catch (error) {
        const failure = shippingUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }
    },
  );
}
