import { screen } from "@testing-library/react";
import { OrderPage } from "./Order";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("shows the order total and the ship-to name", async () => {
  whenApi({
    "/api/me": { user: { role: "customer" } },
    "/api/orders": {
      order: {
        number: "1001",
        status: "paid",
        fulfillment: "ship",
        location: null,
        placedAt: "2026-03-01T15:00:00.000Z",
        subtotalCents: 4800,
        shippingCents: 800,
        taxCents: 448,
        totalCents: 6048,
        shipTo: {
          name: "Mina Adler",
          line1: "100 Market Street",
          city: "Austin",
          region: "TX",
          postalCode: "78701",
          country: "US",
        },
        lines: [
          {
            sku: "LAMP-1",
            name: "Linen shade",
            quantity: 1,
            unitPriceCents: 4800,
            lineTotalCents: 4800,
          },
        ],
        events: [
          {
            status: "paid",
            note: "Paid",
            createdAt: "2026-03-01T15:00:00.000Z",
            actorEmail: "customer@marlow.test",
          },
        ],
        shipment: null,
      },
    },
  });
  await renderPage(<OrderPage />, "/orders/1001", "/orders/:number");

  expect(screen.getByTestId("order-number")).toHaveTextContent("1001");
  expect(screen.getByTestId("order-line-name-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("order-total")).toHaveTextContent("$60.48");
  expect(screen.getByTestId("order-ship-name")).toHaveTextContent("Mina Adler");
});
