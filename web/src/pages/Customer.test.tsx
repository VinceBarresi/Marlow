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
      paymentMethods: [],
      orders: [],
    },
  });
  await renderPage(<Customer />, "/staff/customers/cust-1", "/staff/customers/:id");

  expect(screen.getByTestId("customer-name")).toHaveTextContent("Mina Adler");
  expect(screen.getByTestId("customer-email")).toHaveTextContent("customer@marlow.test");
  expect(screen.getByTestId("customer-cards-empty")).toHaveTextContent("No cards on file.");
  expect(screen.getByTestId("customer-orders-empty")).toHaveTextContent("No orders yet.");
});

test("shows tokenized saved cards without full number or cvc", async () => {
  whenApi({
    "/api/customers": {
      customer: {
        id: "cust-1",
        email: "customer@marlow.test",
        name: "Mina Adler",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      paymentMethods: [
        {
          id: "pm_test",
          card: { brand: "visa", last4: "4242", expMonth: 12, expYear: 2030 },
        },
      ],
      orders: [],
    },
  });
  await renderPage(<Customer />, "/staff/customers/cust-1", "/staff/customers/:id");

  const display = screen.getByTestId("customer-card-display-pm_test");
  expect(display).toHaveTextContent("VISA ···· 4242");
  expect(screen.getByTestId("customer-card-pm_test")).toHaveTextContent("Exp 12/2030");
  expect(display.textContent).not.toMatch(/\d{13,19}/);
});
