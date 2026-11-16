import { screen } from "@testing-library/react";
import { Shop } from "./Shop";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

const shade = {
  sku: "LAMP-1",
  name: "Linen shade",
  category: "Lighting",
  description: "A paper shade.",
  priceCents: 4800,
  onHand: 4,
  reserved: 1,
  available: 3,
};

test("shows a product from the catalog", async () => {
  whenApi({
    "/api/categories": { categories: [{ category: "Lighting", products: 1 }] },
    "/api/products": { products: [shade], total: 1 },
  });
  await renderPage(<Shop />);

  expect(screen.getByTestId("shop-title")).toHaveTextContent("Shop");
  expect(screen.getByTestId("category-link-Lighting")).toHaveTextContent("Lighting");
  expect(screen.getByTestId("product-name-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("product-price-LAMP-1")).toHaveTextContent("$48.00");
});
