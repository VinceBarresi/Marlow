import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Location } from "./Location";

jest.mock("../api", () => ({ api: jest.fn() }));

test("shows the store and a product on its shelf", async () => {
  whenApi({
    "/api/locations": {
      location: {
        slug: "austin-domain",
        name: "Marlow Domain",
        city: "Austin",
        line1: "11600 Century Oaks",
        region: "TX",
        postalCode: "78758",
        phone: "512-555-0108",
        hours: "10–7",
        latitude: 30.4015,
        longitude: -97.7254,
        productsInStock: 1,
      },
      categories: [{ category: "Lighting", products: 1 }],
      products: [
        {
          sku: "LAMP-1",
          name: "Linen shade",
          category: "Lighting",
          priceCents: 4800,
          onHand: 3,
        },
      ],
      total: 1,
    },
  });
  await renderPage(<Location />, "/locations/austin-domain", "/locations/:slug");

  expect(screen.getByTestId("location-name")).toHaveTextContent("Marlow Domain");
  expect(screen.getByTestId("location-row-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("location-on-hand-LAMP-1")).toHaveTextContent("3");
});
