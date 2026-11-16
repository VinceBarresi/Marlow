import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Inventory } from "./Inventory";

jest.mock("../api", () => ({ api: jest.fn() }));

test("lists warehouse stock for a sku", async () => {
  whenApi({
    "/api/inventory": {
      inventory: [
        {
          sku: "LAMP-1",
          name: "Linen shade",
          category: "Lighting",
          priceCents: 4800,
          onHand: 4,
          reserved: 1,
          available: 3,
          reorderPoint: 2,
          bin: "A-1",
        },
      ],
      total: 1,
    },
  });
  await renderPage(<Inventory />);

  expect(screen.getByTestId("inventory-name-LAMP-1")).toHaveTextContent("Linen shade");
  expect(screen.getByTestId("inventory-bin-LAMP-1")).toHaveTextContent("A-1");
  expect(screen.getByTestId("inventory-available-LAMP-1")).toHaveTextContent("3");
});
