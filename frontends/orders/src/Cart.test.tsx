import { screen } from "@testing-library/react";
import { CartPage } from "./Cart";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("shows a line in the cart", async () => {
  whenApi({
    "/api/cart": {
      items: [
        {
          sku: "LAMP-1",
          name: "Linen shade",
          priceCents: 4800,
          quantity: 1,
          available: 3,
          lineTotalCents: 4800,
        },
      ],
      subtotalCents: 4800,
    },
  });
  await renderPage(<CartPage />);

  expect(screen.getByTestId("cart-title")).toHaveTextContent("Cart");
  expect(screen.getByTestId("cart-link-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("cart-line-total-LAMP-1")).toHaveTextContent("$48.00");
});
