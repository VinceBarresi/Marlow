import { test, type Page } from "@playwright/test";
import { emptyOrdersListResponseModel } from "../../../fixtures/models/ordersModel";
import { OrdersPage } from "../../pages/orders.page";
import { loginAsAdmin, loginAsCustomer } from "../../support/login";

async function stubEmptyOrders(page: Page) {
  await page.route("**/api/orders**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyOrdersListResponseModel),
    });
  });
}

test.describe("integ empty orders", () => {
  test("shows empty orders when the orders API is stubbed", async ({ page }) => {
    await loginAsCustomer(page);
    await stubEmptyOrders(page);

    const orders = new OrdersPage(page);
    await orders.gotoCustomer();
    await orders.expectCustomerEmpty();
  });

  test("shows empty fulfillment when the orders API is stubbed", async ({ page }) => {
    await loginAsAdmin(page);
    await stubEmptyOrders(page);

    const orders = new OrdersPage(page);
    await orders.gotoStaff();
    await orders.expectFulfillmentEmpty();
  });
});
