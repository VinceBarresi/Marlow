import { expect, test, type APIRequestContext } from "@playwright/test";
import { catalogEndpoints } from "../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { locationsEndpoints, seedLocationSlug } from "../../fixtures/endpoints/locationsEndpoints";
import { ordersEndpoints } from "../../fixtures/endpoints/ordersEndpoints";
import {
  checkoutOrderKeys,
  shipCheckoutRequestModel,
  shipRequestModel,
} from "../../fixtures/models/ordersModel";

async function loginAs(request: APIRequestContext, email: string) {
  const login = await request.post(loginEndpoints.login, {
    data: { email, password: "datalab" },
  });
  expect(login.status()).toBe(200);
}

async function clearCart(request: APIRequestContext) {
  const response = await request.get(ordersEndpoints.cart);
  expect(response.status()).toBe(200);
  const body = await response.json();
  for (const item of body.items as { sku: string }[]) {
    const del = await request.delete(ordersEndpoints.cartItem(item.sku));
    expect(del.status()).toBe(200);
  }
}

async function firstWarehouseSku(request: APIRequestContext) {
  const response = await request.get(catalogEndpoints.products);
  expect(response.status()).toBe(200);
  const body = await response.json();
  const product = (body.products as { sku: string; available: number }[]).find(
    (row) => row.available > 0,
  );
  expect(product).toBeTruthy();
  return product!.sku;
}

async function createShipOrder(request: APIRequestContext) {
  await loginAs(request, "customer@marlow.test");
  await clearCart(request);
  const sku = await firstWarehouseSku(request);
  const put = await request.put(ordersEndpoints.cartItems, {
    data: { sku, quantity: 1 },
  });
  expect(put.status()).toBe(200);

  const checkout = await request.post(ordersEndpoints.checkout, {
    data: shipCheckoutRequestModel,
  });
  expect(checkout.status()).toBe(201);
  const body = await checkout.json();
  expect(Object.keys(body).sort()).toEqual(["order"]);
  expect(Object.keys(body.order).sort()).toEqual([...checkoutOrderKeys].sort());
  expect(body.order.status).toBe("paid");
  expect(body.order.number).toEqual(expect.any(String));
  expect(body.order.number).not.toEqual("");
  return body.order.number as string;
}

test.describe("checkout and fulfillment API", () => {
  test("gets order detail after checkout", async ({ request }) => {
    const number = await createShipOrder(request);
    const response = await request.get(ordersEndpoints.order(number));
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["order"]);
    expect(body.order.number).toBe(number);
    expect(body.order.status).toBe("paid");
    expect(body.order.fulfillment).toBe("ship");
    expect(body.order.lines.length).toBeGreaterThan(0);
  });

  test("cancels a paid order", async ({ request }) => {
    const number = await createShipOrder(request);
    const response = await request.post(ordersEndpoints.cancel(number));
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ number, status: "cancelled" });

    const detail = await request.get(ordersEndpoints.order(number));
    expect(detail.status()).toBe(200);
    expect((await detail.json()).order.status).toBe("cancelled");
  });

  test("picks, ships, updates tracking, goes out for delivery, and delivers", async ({
    request,
  }) => {
    const number = await createShipOrder(request);
    await loginAs(request, "staff@marlow.test");

    const pick = await request.post(ordersEndpoints.pick(number));
    expect(pick.status()).toBe(200);
    expect(await pick.json()).toEqual({ number, status: "picking" });

    const ship = await request.post(ordersEndpoints.ship(number), {
      data: shipRequestModel,
    });
    expect(ship.status()).toBe(200);
    const shipBody = await ship.json();
    expect(shipBody).toMatchObject({
      number,
      status: "shipped",
      carrier: shipRequestModel.carrier,
      service: shipRequestModel.service,
    });
    expect(shipBody.trackingNumber).toEqual(expect.any(String));
    expect(shipBody.trackingNumber).not.toEqual("");

    const trackingNumber = `TESTTRACK${Date.now()}`;
    const tracking = await request.post(ordersEndpoints.tracking(number), {
      data: { trackingNumber },
    });
    expect(tracking.status()).toBe(200);
    expect(await tracking.json()).toEqual({ number, trackingNumber });

    const out = await request.post(ordersEndpoints.outForDelivery(number));
    expect(out.status()).toBe(200);
    expect(await out.json()).toEqual({ number, status: "out_for_delivery" });

    const deliver = await request.post(ordersEndpoints.deliver(number));
    expect(deliver.status()).toBe(200);
    expect(await deliver.json()).toEqual({ number, status: "delivered" });

    const detail = await request.get(ordersEndpoints.order(number));
    expect(detail.status()).toBe(200);
    const order = (await detail.json()).order;
    expect(order.status).toBe("delivered");
    expect(order.shipment.trackingNumber).toBe(trackingNumber);
  });

  test("checks out for pickup and staff collects", async ({ request }) => {
    await loginAs(request, "customer@marlow.test");
    await clearCart(request);

    const locations = await request.get(locationsEndpoints.locations);
    expect(locations.status()).toBe(200);
    const store = ((await locations.json()).locations as { id: string; slug: string }[]).find(
      (row) => row.slug === seedLocationSlug,
    );
    expect(store).toBeTruthy();

    const detail = await request.get(locationsEndpoints.location(seedLocationSlug));
    expect(detail.status()).toBe(200);
    const product = ((await detail.json()).products as { sku: string; onHand: number }[]).find(
      (row) => row.onHand > 0,
    );
    expect(product).toBeTruthy();

    const put = await request.put(ordersEndpoints.cartItems, {
      data: { sku: product!.sku, quantity: 1 },
    });
    expect(put.status()).toBe(200);

    const checkout = await request.post(ordersEndpoints.checkout, {
      data: {
        fulfillment: "pickup",
        locationId: store!.id,
        shipName: "Mina Adler",
      },
    });
    expect(checkout.status()).toBe(201);
    const number = (await checkout.json()).order.number as string;

    await loginAs(request, "staff@marlow.test");
    const collect = await request.post(ordersEndpoints.collect(number));
    expect(collect.status()).toBe(200);
    expect(await collect.json()).toEqual({ number, status: "delivered" });
  });

  test("rejects pick for a customer", async ({ request }) => {
    const number = await createShipOrder(request);
    const pick = await request.post(ordersEndpoints.pick(number));
    expect(pick.status()).toBe(403);
    expect(await pick.json()).toEqual({ error: "Staff only." });

    await loginAs(request, "staff@marlow.test");
    const cancel = await request.post(ordersEndpoints.cancel(number));
    expect(cancel.status()).toBe(200);
  });
});
