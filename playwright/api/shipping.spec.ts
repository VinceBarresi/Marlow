import { expect, test, type APIRequestContext } from "@playwright/test";

async function login(request: APIRequestContext, email: string) {
  const response = await request.post("/api/login", {
    data: { email, password: "datalab" },
  });
  expect(response.status()).toBe(200);
}

async function createShippedOrder(request: APIRequestContext) {
  await login(request, "customer@marlow.test");
  const products = await request.get("/api/products");
  expect(products.status()).toBe(200);
  const body = await products.json();
  const product = (body.products as { sku: string; available: number }[]).find(
    (row) => row.available > 0,
  );
  expect(product).toBeTruthy();

  const put = await request.put("/api/cart/items", {
    data: { sku: product!.sku, quantity: 1 },
  });
  expect(put.status()).toBe(200);

  const checkout = await request.post("/api/checkout", {
    data: {
      fulfillment: "ship",
      shipName: "Mina Adler",
      shipLine1: "100 Congress Ave",
      shipCity: "Austin",
      shipRegion: "TX",
      shipPostalCode: "78701",
    },
  });
  expect(checkout.status()).toBe(201);
  const number = (await checkout.json()).order.number as string;

  await login(request, "staff@marlow.test");
  expect((await request.post(`/api/orders/${number}/pick`)).status()).toBe(200);
  const ship = await request.post(`/api/orders/${number}/ship`, {
    data: { carrier: "FedEx", service: "Ground" },
  });
  expect(ship.status()).toBe(200);
  const shipBody = await ship.json();
  expect(shipBody.trackingNumber).toEqual(expect.any(String));
  expect(shipBody.trackingNumber).not.toEqual("");
  return { number, trackingNumber: shipBody.trackingNumber as string };
}

test.describe("shipping Bearer API", () => {
  test("mints a shipping access token and tracks with Bearer", async ({
    request,
    playwright,
    baseURL,
  }) => {
    const { trackingNumber } = await createShippedOrder(request);

    await login(request, "customer@marlow.test");
    const tokenResponse = await request.post("/api/shipping/access-token");
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json();
    expect(Object.keys(tokenBody).sort()).toEqual(["accessToken", "expiresIn", "tokenType"]);
    expect(tokenBody.tokenType).toBe("bearer");
    expect(tokenBody.accessToken).toEqual(expect.any(String));
    expect(tokenBody.accessToken).not.toEqual("");

    const anon = await playwright.request.newContext({ baseURL });
    const track = await anon.get(`/api/tracking/${encodeURIComponent(trackingNumber)}`, {
      headers: { Authorization: `Bearer ${tokenBody.accessToken}` },
    });
    expect(track.status()).toBe(200);
    const trackBody = await track.json();
    expect(trackBody.tracking).toMatchObject({
      trackingNumber,
      carrier: "FedEx",
      status: "in_transit",
    });
    expect(trackBody.tracking.scans.length).toBeGreaterThan(0);
    await anon.dispose();
  });

  test("rejects tracking without a session or Bearer token", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get("/api/tracking/DOESNOTEXIST");
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });
});
