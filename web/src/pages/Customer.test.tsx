import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Customer } from "./Customer";

jest.mock("../api", () => ({ api: jest.fn() }));

test("shows a customer with no orders", async () => {
  whenApi({
    "/api/customers": {
      customer: {
        id: "cust-1",
        email: "customer@marlow.test",
        name: "Mina Adler",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      orders: [],
    },
  });
  await renderPage(<Customer />, "/staff/customers/cust-1", "/staff/customers/:id");

  expect(screen.getByTestId("customer-name")).toHaveTextContent("Mina Adler");
  expect(screen.getByTestId("customer-email")).toHaveTextContent("customer@marlow.test");
  expect(screen.getByTestId("customer-orders-empty")).toHaveTextContent("No orders yet.");
});
