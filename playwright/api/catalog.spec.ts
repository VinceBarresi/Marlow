import { expect, test } from "@playwright/test";
import { catalogEndpoints } from "../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { categoryKeys, inventoryItemKeys, productKeys } from "../../fixtures/models/catalogModel";

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

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["page", "pageSize", "products", "total"]);
    expect(body.products.length).toBeGreaterThan(0);

    const product = body.products[0];
    expect(Object.keys(product).sort()).toEqual([...productKeys].sort());
    expect(product.sku).toEqual(expect.any(String));
    expect(product.sku).not.toEqual("");

    const detail = await request.get(catalogEndpoints.product(product.sku));
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    expect(Object.keys(detailBody).sort()).toEqual(["product"]);
    expect(Object.keys(detailBody.product).sort()).toEqual([...productKeys].sort());
    expect(detailBody.product.sku).toBe(product.sku);
  });

  test("lists categories", async ({ request }) => {
    const response = await request.get(catalogEndpoints.categories);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["categories"]);
    expect(body.categories.length).toBeGreaterThan(0);
    expect(Object.keys(body.categories[0]).sort()).toEqual([...categoryKeys].sort());
  });

  test("rejects products without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(catalogEndpoints.products);
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });

  test("rejects inventory for a customer", async ({ request }) => {
    const response = await request.get(catalogEndpoints.inventory);
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Staff only." });
  });

  test("lists inventory for staff", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "staff@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(catalogEndpoints.inventory);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["inventory", "page", "pageSize", "total"]);
    expect(body.inventory.length).toBeGreaterThan(0);
    expect(Object.keys(body.inventory[0]).sort()).toEqual([...inventoryItemKeys].sort());
  });
});
