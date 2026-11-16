import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Locations } from "./Locations";

jest.mock("../api", () => ({ api: jest.fn() }));
jest.mock("../StoreMap", () => ({ StoreMap: () => null }));

test("lists a store", async () => {
  whenApi({
    "/api/locations": {
      locations: [
        {
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
          productsInStock: 12,
        },
      ],
    },
  });
  await renderPage(<Locations />);

  expect(screen.getByTestId("locations-title")).toHaveTextContent("Locations");
  expect(screen.getByTestId("location-name-austin-domain")).toHaveTextContent("Marlow Domain");
  expect(screen.getByTestId("location-stock-austin-domain")).toHaveTextContent("12 products");
});
