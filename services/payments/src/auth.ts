import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, type TokenClaims } from "./token.js";

export type AuthConfig = {
  tokenSecret: string;
};

declare module "fastify" {
  interface FastifyRequest {
    paymentsAuth?: TokenClaims;
  }
}

export function bearerFromRequest(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireBearer(config: AuthConfig, scopes?: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerFromRequest(request);
    if (!token) {
      return reply.code(401).send({ error: "Bearer token required." });
    }
    const claims = verifyAccessToken(token, config.tokenSecret);
    if (!claims) {
      return reply.code(401).send({ error: "Invalid or expired access token." });
    }
    if (
      scopes &&
      scopes.length > 0 &&
      !scopes.some((scope) => claims.scope.split(" ").includes(scope))
    ) {
      return reply.code(403).send({ error: "Insufficient token scope." });
    }
    request.paymentsAuth = claims;
  };
}
