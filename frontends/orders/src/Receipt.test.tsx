import { screen } from "@testing-library/react";
import { Receipt } from "./Receipt";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("shows the receipt for a shipped order", async () => {
  whenApi({
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
        events: [],
        shipment: null,
      },
    },
  });
  await renderPage(<Receipt />, "/orders/1001/confirmed", "/orders/:number/confirmed");

  expect(screen.getByTestId("receipt-title")).toHaveTextContent("Receipt");
  expect(screen.getByTestId("receipt-number")).toHaveTextContent("1001");
  expect(screen.getByTestId("receipt-line-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("receipt-order")).toHaveAttribute("href", "/orders/1001");
});
