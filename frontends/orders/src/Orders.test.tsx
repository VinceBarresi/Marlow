import { screen } from "@testing-library/react";
import { Orders } from "./Orders";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

const summary = {
  number: "1001",
  status: "paid",
  fulfillment: "ship" as const,
  locationName: null,
  placedAt: "2026-03-01T15:00:00.000Z",
  totalCents: 6048,
  shipCity: "Austin",
  shipRegion: "TX",
  customerEmail: "customer@marlow.test",
  lineCount: 1,
};

test("lists one of your orders", async () => {
  whenApi({ "/api/orders": { orders: [summary], total: 1 } });
  await renderPage(<Orders />);

  expect(screen.getByTestId("orders-title")).toHaveTextContent("Your orders");
  expect(screen.getByTestId("orders-link-1001")).toHaveTextContent("1001");
  expect(screen.getByTestId("orders-status-1001")).toHaveTextContent("paid");
  expect(screen.getByTestId("orders-total-1001")).toHaveTextContent("$60.48");
});

test("shows empty state when you have no orders", async () => {
  whenApi({ "/api/orders": { orders: [], total: 0 } });
  await renderPage(<Orders />);

  expect(screen.getByTestId("orders-title")).toHaveTextContent("Your orders");
  expect(screen.getByTestId("orders-count")).toHaveTextContent("0 orders");
  expect(screen.getByTestId("orders-empty")).toHaveTextContent("You have no orders yet.");
});

test("shows filtered empty state for staff fulfillment", async () => {
  whenApi({ "/api/orders": { orders: [], total: 0 } });
  await renderPage(<Orders staff />, "/staff/orders?status=cancelled", "/staff/orders");

  expect(screen.getByTestId("fulfillment-title")).toHaveTextContent("All orders");
  expect(screen.getByTestId("fulfillment-empty")).toHaveTextContent("No orders with that status.");
});
