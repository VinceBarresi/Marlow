import { expect, test, type APIRequestContext } from "@playwright/test";

const expYear = new Date().getFullYear() + 2;

async function login(request: APIRequestContext, email: string) {
  const response = await request.post("/api/login", {
    data: { email, password: "datalab" },
  });
  expect(response.status()).toBe(200);
}

async function firstSku(request: APIRequestContext) {
  const products = await request.get("/api/products");
  expect(products.status()).toBe(200);
  const body = await products.json();
  const product = (body.products as { sku: string; available: number }[]).find(
    (row) => row.available > 0,
  );
  expect(product).toBeTruthy();
  return product!.sku;
}

test.describe("payments sandbox API", () => {
  test("saves, lists, and removes a tokenized card", async ({ request }) => {
    await login(request, "customer@marlow.test");
    const created = await request.post("/api/payment-methods", {
      data: {
        card: { number: "4242424242424242", expMonth: 12, expYear, cvc: "123" },
      },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.paymentMethod.id).toMatch(/^pm_/);
    expect(createdBody.paymentMethod.card).toMatchObject({ brand: "visa", last4: "4242" });
    expect(createdBody.paymentMethod.card).not.toHaveProperty("number");
    expect(createdBody.paymentMethod.card).not.toHaveProperty("cvc");
    const id = createdBody.paymentMethod.id as string;

    const list = await request.get("/api/payment-methods");
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.paymentMethods.map((row: { id: string }) => row.id)).toContain(id);

    const deleted = await request.delete(`/api/payment-methods/${encodeURIComponent(id)}`);
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toMatchObject({ id, deleted: true });
  });

  test("checks out with a successful test card", async ({ request }) => {
    await login(request, "customer@marlow.test");
    const sku = await firstSku(request);
    expect((await request.put("/api/cart/items", { data: { sku, quantity: 1 } })).status()).toBe(
      200,
    );
    const checkout = await request.post("/api/checkout", {
      data: {
        fulfillment: "ship",
        shipName: "Mina Adler",
        shipLine1: "100 Congress Ave",
        shipCity: "Austin",
        shipRegion: "TX",
        shipPostalCode: "78701",
        card: { number: "4242424242424242", expMonth: 12, expYear, cvc: "123" },
        saveCard: false,
      },
    });
    expect(checkout.status()).toBe(201);
    const body = await checkout.json();
    expect(body.order.number).toMatch(/^MRW-/);
    expect(body.order.status).toBe("paid");
  });

  test("declines checkout with the Stripe decline test card", async ({ request }) => {
    await login(request, "customer@marlow.test");
    const sku = await firstSku(request);
    expect((await request.put("/api/cart/items", { data: { sku, quantity: 1 } })).status()).toBe(
      200,
    );
    const checkout = await request.post("/api/checkout", {
      data: {
        fulfillment: "ship",
        shipName: "Mina Adler",
        shipLine1: "100 Congress Ave",
        shipCity: "Austin",
        shipRegion: "TX",
        shipPostalCode: "78701",
        card: { number: "4000000000000002", expMonth: 12, expYear, cvc: "123" },
      },
    });
    expect(checkout.status()).toBe(402);
    const body = await checkout.json();
    expect(body).toHaveProperty("error");
    expect(body.declineCode).toBe("card_declined");
  });

  test("rejects payment-methods without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get("/api/payment-methods");
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });
});
