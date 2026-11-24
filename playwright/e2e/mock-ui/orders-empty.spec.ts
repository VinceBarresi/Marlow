import { expect, test } from "@playwright/test";
import { OrdersPage } from "../../pages/orders.page";
import { loginAsCustomer } from "../../support/login";

test("shows the empty state when the orders API returns no rows", async ({ page }) => {
  await loginAsCustomer(page);

  await page.route("**/api/orders**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: [], total: 0 }),
    });
  });

  const orders = new OrdersPage(page);
  await orders.goto();
  await orders.expectEmpty();
  await expect(page).toHaveURL(/\/orders/);
});
