import assert from "node:assert/strict";
import test from "node:test";
import { money } from "./format.ts";

test("money formats cents as USD", () => {
  assert.equal(money(3200), "$32.00");
  assert.equal(money(0), "$0.00");
  assert.equal(money(14800), "$148.00");
});
