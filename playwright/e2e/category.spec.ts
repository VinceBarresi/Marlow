import { expect, test } from "@playwright/test";
import { CategoryPage } from "../pages/category.page";
import { ShopPage } from "../pages/shop.page";
import { loginAsCustomer } from "../support/login";

test("opens a category from the shop and shows products", async ({ page }) => {
  await loginAsCustomer(page);

  const shop = new ShopPage(page);
  const category = new CategoryPage(page);

  await shop.goto();
  await shop.expectLoaded();
  await shop.openFirstCategory();

  await expect(page).toHaveURL(/\/categories\//);
  await category.expectLoaded();
  await category.expectProductGrid();
});
