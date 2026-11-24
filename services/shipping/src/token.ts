import { createHmac, timingSafeEqual } from "node:crypto";

export type TokenClaims = {
  sub: string;
  scope: string;
  role?: string;
  typ: "service" | "user";
  iat: number;
  exp: number;
};

function b64urlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parsePart(part: string) {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

export function signAccessToken(
  claims: Omit<TokenClaims, "iat" | "exp">,
  secret: string,
  expiresInSec: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson({ ...claims, iat: now, exp: now + expiresInSec });
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyAccessToken(token: string, secret: string): TokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const claims = parsePart(payload) as TokenClaims;
    if (!claims.sub || !claims.scope || !claims.exp || !claims.typ) return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
