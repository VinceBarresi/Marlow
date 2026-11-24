import { expect, test } from "@playwright/test";
import { catalogEndpoints } from "../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import {
  categoryListSchema,
  errorSchema,
  inventoryListSchema,
  productListSchema,
  productResponseSchema,
} from "../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../fixtures/schemas/assertSchema";

test.describe("catalog API", () => {
  test.beforeEach(async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);
  });

  test("lists products and returns a product by sku", async ({ request }) => {
    const response = await request.get(catalogEndpoints.products);
    expect(response.status()).toBe(200);

    const list = assertSchema(productListSchema, await response.json(), "products");
    expect(list.products.length).toBeGreaterThan(0);

    const product = list.products[0];
    const detail = await request.get(catalogEndpoints.product(product.sku));
    expect(detail.status()).toBe(200);
    const parsed = assertSchema(productResponseSchema, await detail.json(), "product");
    expect(parsed.product.sku).toBe(product.sku);
  });

  test("lists categories", async ({ request }) => {
    const response = await request.get(catalogEndpoints.categories);
    expect(response.status()).toBe(200);

    const list = assertSchema(categoryListSchema, await response.json(), "categories");
    expect(list.categories.length).toBeGreaterThan(0);
  });

  test("rejects products without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(catalogEndpoints.products);
    expect(response.status()).toBe(401);
    assertSchema(errorSchema, await response.json(), "products unauthorized");
    await anon.dispose();
  });

  test("rejects inventory for a customer", async ({ request }) => {
    const response = await request.get(catalogEndpoints.inventory);
    expect(response.status()).toBe(403);
    const body = await response.json();
    assertSchema(errorSchema, body, "inventory forbidden");
    expect(body).toEqual({ error: "Staff only." });
  });

  test("lists inventory for staff", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "staff@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(catalogEndpoints.inventory);
    expect(response.status()).toBe(200);

    const list = assertSchema(inventoryListSchema, await response.json(), "inventory");
    expect(list.inventory.length).toBeGreaterThan(0);
  });
});
