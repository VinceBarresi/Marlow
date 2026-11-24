import { expect, test } from "@playwright/test";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../fixtures/endpoints/ordersEndpoints";
import {
  emptyCartResponseModel,
  emptyOrdersListResponseModel,
} from "../../fixtures/models/ordersModel";

test.describe("orders and cart API", () => {
  test.beforeEach(async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);
  });

  test("returns an empty cart for a fresh session", async ({ request }) => {
    const response = await request.get(ordersEndpoints.cart);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["items", "subtotalCents"]);
    expect(body).toMatchObject(emptyCartResponseModel);
    expect(body.items).toEqual([]);
  });

  test("returns an empty orders list for an unknown status", async ({ request }) => {
    const response = await request.get(
      `${ordersEndpoints.orders}?status=no_such_status&page=1&pageSize=20`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["orders", "page", "pageSize", "total"]);
    expect(body).toMatchObject(emptyOrdersListResponseModel);
    expect(body.orders).toEqual([]);
  });

  test("rejects cart without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(ordersEndpoints.cart);
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });
});
