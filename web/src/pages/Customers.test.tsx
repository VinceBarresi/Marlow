import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Customers } from "./Customers";

jest.mock("../api", () => ({ api: jest.fn() }));

test("lists a customer and how much they have spent", async () => {
  whenApi({
    "/api/customers": {
      customers: [
        {
          id: "cust-1",
          email: "customer@marlow.test",
          name: "Mina Adler",
          createdAt: "2026-01-01T00:00:00.000Z",
          orders: 2,
          spentCents: 4800,
        },
      ],
      total: 1,
    },
  });
  await renderPage(<Customers />);

  expect(screen.getByTestId("customers-link-cust-1")).toHaveTextContent("Mina Adler");
  expect(screen.getByTestId("customers-orders-cust-1")).toHaveTextContent("2");
  expect(screen.getByTestId("customers-spent-cust-1")).toHaveTextContent("$48.00");
});
