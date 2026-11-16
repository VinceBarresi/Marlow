import assert from "node:assert/strict";
import test from "node:test";
import { pageQuery, useCache } from "./query.js";

test("useCache skips Redis only when false or 0", () => {
  assert.equal(useCache(undefined), true);
  assert.equal(useCache("true"), true);
  assert.equal(useCache("false"), false);
  assert.equal(useCache("0"), false);
});

test("pageQuery clamps page and page size", () => {
  assert.deepEqual(pageQuery({}), { page: 1, pageSize: 24, offset: 0 });
  assert.deepEqual(pageQuery({ page: "3", pageSize: "10" }), { page: 3, pageSize: 10, offset: 20 });
  assert.deepEqual(pageQuery({ page: "0", pageSize: "500" }), { page: 1, pageSize: 200, offset: 0 });
});
