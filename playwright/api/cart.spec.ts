import { expect, test, type APIRequestContext } from "@playwright/test";
import { catalogEndpoints } from "../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../fixtures/endpoints/ordersEndpoints";
import { emptyCartResponseModel } from "../../fixtures/models/ordersModel";
import {
  cartItemResultSchema,
  cartSchema,
  errorSchema,
  okSchema,
  productListSchema,
} from "../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../fixtures/schemas/assertSchema";

async function clearCart(request: APIRequestContext) {
  const response = await request.get(ordersEndpoints.cart);
  expect(response.status()).toBe(200);
  const body = assertSchema(cartSchema, await response.json(), "cart clear");
  for (const item of body.items) {
    const del = await request.delete(ordersEndpoints.cartItem(item.sku));
    expect(del.status()).toBe(200);
  }
}

async function firstAvailableSku(request: APIRequestContext) {
  const response = await request.get(catalogEndpoints.products);
  expect(response.status()).toBe(200);
  const body = assertSchema(productListSchema, await response.json(), "products");
  const product = body.products.find((row) => row.available > 0);
  expect(product).toBeTruthy();
  return product!.sku;
}

test.describe("cart API", () => {
  test.beforeEach(async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);
    await clearCart(request);
  });

  test("puts an item, returns it in the cart, then deletes it", async ({ request }) => {
    const sku = await firstAvailableSku(request);

    const put = await request.put(ordersEndpoints.cartItems, {
      data: { sku, quantity: 1 },
    });
    expect(put.status()).toBe(200);
    const putBody = assertSchema(cartItemResultSchema, await put.json(), "cart put");
    expect(putBody).toMatchObject({ ok: true, sku, quantity: 1 });

    const cart = await request.get(ordersEndpoints.cart);
    expect(cart.status()).toBe(200);
    const cartBody = assertSchema(cartSchema, await cart.json(), "cart");
    expect(cartBody.items).toHaveLength(1);
    expect(cartBody.items[0].sku).toBe(sku);
    expect(cartBody.items[0].quantity).toBe(1);
    expect(cartBody.subtotalCents).toBeGreaterThan(0);

    const del = await request.delete(ordersEndpoints.cartItem(sku));
    expect(del.status()).toBe(200);
    assertSchema(okSchema, await del.json(), "cart delete");

    const empty = await request.get(ordersEndpoints.cart);
    expect(empty.status()).toBe(200);
    const emptyBody = assertSchema(cartSchema, await empty.json(), "empty cart");
    expect(emptyBody).toMatchObject(emptyCartResponseModel);
    expect(emptyBody.items).toEqual([]);
  });

  test("rejects cart mutations without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.put(ordersEndpoints.cartItems, {
      data: { sku: "ANY", quantity: 1 },
    });
    expect(response.status()).toBe(401);
    assertSchema(errorSchema, await response.json(), "cart unauthorized");
    await anon.dispose();
  });
});
