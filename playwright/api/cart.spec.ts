import { expect, test, type APIRequestContext } from "@playwright/test";
import { catalogEndpoints } from "../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../fixtures/endpoints/ordersEndpoints";
import { cartItemKeys, emptyCartResponseModel } from "../../fixtures/models/ordersModel";

async function clearCart(request: APIRequestContext) {
  const response = await request.get(ordersEndpoints.cart);
  expect(response.status()).toBe(200);
  const body = await response.json();
  for (const item of body.items as { sku: string }[]) {
    const del = await request.delete(ordersEndpoints.cartItem(item.sku));
    expect(del.status()).toBe(200);
  }
}

async function firstAvailableSku(request: APIRequestContext) {
  const response = await request.get(catalogEndpoints.products);
  expect(response.status()).toBe(200);
  const body = await response.json();
  const product = (body.products as { sku: string; available: number }[]).find(
    (row) => row.available > 0,
  );
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
    expect(await put.json()).toMatchObject({ ok: true, sku, quantity: 1 });

    const cart = await request.get(ordersEndpoints.cart);
    expect(cart.status()).toBe(200);
    const cartBody = await cart.json();
    expect(Object.keys(cartBody).sort()).toEqual(["items", "subtotalCents"]);
    expect(cartBody.items).toHaveLength(1);
    expect(Object.keys(cartBody.items[0]).sort()).toEqual([...cartItemKeys].sort());
    expect(cartBody.items[0].sku).toBe(sku);
    expect(cartBody.items[0].quantity).toBe(1);
    expect(cartBody.subtotalCents).toBeGreaterThan(0);

    const del = await request.delete(ordersEndpoints.cartItem(sku));
    expect(del.status()).toBe(200);
    expect(await del.json()).toEqual({ ok: true });

    const empty = await request.get(ordersEndpoints.cart);
    expect(empty.status()).toBe(200);
    const emptyBody = await empty.json();
    expect(emptyBody).toMatchObject(emptyCartResponseModel);
    expect(emptyBody.items).toEqual([]);
  });

  test("rejects cart mutations without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.put(ordersEndpoints.cartItems, {
      data: { sku: "ANY", quantity: 1 },
    });
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });
});
