import { scrypt, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { promisify } from "node:util";
import { verifyPassword } from "./passwords.js";

const scryptAsync = promisify(scrypt);

async function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

test("verifyPassword accepts the matching password", async () => {
  const stored = await hash("datalab");
  assert.equal(await verifyPassword("datalab", stored), true);
});

test("verifyPassword rejects a wrong or malformed hash", async () => {
  const stored = await hash("datalab");
  assert.equal(await verifyPassword("nope", stored), false);
  assert.equal(await verifyPassword("datalab", "not-a-hash"), false);
});
