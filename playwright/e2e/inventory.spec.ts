import { test } from "@playwright/test";
import { InventoryPage } from "../pages/inventory.page";
import { loginAsStaff } from "../support/login";

test("shows inventory title and table", async ({ page }) => {
  await loginAsStaff(page);
  const inventory = new InventoryPage(page);
  await inventory.goto();
  await inventory.expectLoaded();
});
