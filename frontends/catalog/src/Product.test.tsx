import { screen } from "@testing-library/react";
import { ProductPage } from "./Product";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("shows the product and an add-to-cart control", async () => {
  whenApi({
    "/api/me": {
      user: {
        id: "u1",
        email: "customer@marlow.test",
        name: "Mina Adler",
        role: "customer",
      },
    },
    "/api/products": {
      product: {
        sku: "LAMP-1",
        name: "Linen shade",
        category: "Lighting",
        description: "A paper shade.",
        priceCents: 4800,
        onHand: 4,
        reserved: 1,
        available: 3,
        imageUrl: "/api/images/abc",
        imageId: "abc",
      },
    },
  });
  await renderPage(<ProductPage />, "/products/LAMP-1", "/products/:sku");

  expect(screen.getByTestId("product-name")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("product-price")).toHaveTextContent("$48.00");
  expect(screen.getByTestId("product-image")).toBeInTheDocument();
  expect(screen.getByTestId("product-add")).toBeEnabled();
  expect(screen.queryByTestId("product-image-upload")).toBeNull();
});
