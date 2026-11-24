import type { ZodType } from "zod";

/** Parse `body` with a Zod schema; throws a clear message on mismatch. */
export function assertSchema<T>(schema: ZodType<T>, body: unknown, label = "response"): T {
  const result = schema.safeParse(body);
  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  throw new Error(`${label} failed schema: ${details}`);
}
