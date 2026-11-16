import assert from "node:assert/strict";
import test from "node:test";
import { quote } from "./pricing.js";

test("orders under $75 pay $8 shipping and 8% tax", () => {
  assert.deepEqual(quote(6400), {
    subtotalCents: 6400,
    shippingCents: 800,
    taxCents: 512,
    totalCents: 7712,
  });
});

test("orders of $75 or more ship free", () => {
  assert.deepEqual(quote(7500), {
    subtotalCents: 7500,
    shippingCents: 0,
    taxCents: 600,
    totalCents: 8100,
  });
});
