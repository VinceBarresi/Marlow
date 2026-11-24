import { test } from "@playwright/test";
import { CartPage } from "../pages/cart.page";
import { OrdersPage } from "../pages/orders.page";
import { loginAsAdmin, loginAsCustomer } from "../support/login";

test.describe("empty cart and orders states", () => {
  test("shows an empty cart after sign-in", async ({ page }) => {
    await loginAsCustomer(page);
    const cart = new CartPage(page);
    await cart.goto();
    await cart.expectEmpty();
  });

  test("shows filtered empty orders for the customer", async ({ page }) => {
    await loginAsCustomer(page);
    const orders = new OrdersPage(page);
    await orders.gotoCustomer("?status=no_such_status");
    await orders.expectCustomerFilteredEmpty();
  });

  test("shows filtered empty fulfillment for staff", async ({ page }) => {
    await loginAsAdmin(page);
    const orders = new OrdersPage(page);
    await orders.gotoStaff("?status=no_such_status");
    await orders.expectFulfillmentFilteredEmpty();
  });
});
