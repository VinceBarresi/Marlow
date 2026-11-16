import { screen } from "@testing-library/react";
import { CategoryPage } from "./Category";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("shows products in the category from the route", async () => {
  whenApi({
    "/api/products": {
      products: [
        {
          sku: "LAMP-1",
          name: "Linen shade",
          category: "Lighting",
          description: "A paper shade.",
          priceCents: 4800,
          onHand: 4,
          reserved: 1,
          available: 3,
        },
      ],
      total: 1,
    },
  });
  await renderPage(<CategoryPage />, "/categories/Lighting", "/categories/:category");

  expect(screen.getByTestId("category-title")).toHaveTextContent("Lighting");
  expect(screen.getByTestId("product-name-LAMP-1")).toHaveTextContent("Linen shade");
});
