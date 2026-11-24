import { test } from "@playwright/test";
import { ShellPage } from "../pages/shell.page";
import { ShopPage } from "../pages/shop.page";
import { loginAsCustomer } from "../support/login";

test.describe("shop", () => {
  test("signs in through the API and opens the shop", async ({ page }) => {
    await loginAsCustomer(page);

    const shop = new ShopPage(page);
    const shell = new ShellPage(page);

    await shop.goto();
    await shell.expectNavUserContains("customer@marlow.test");
    await shop.expectLoaded();
  });

  test("shows a product grid and count", async ({ page }) => {
    await loginAsCustomer(page);
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.expectLoaded();
    await shop.expectProductGrid();
  });

  test("shows shop-empty for a nonsense search", async ({ page }) => {
    await loginAsCustomer(page);
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.expectLoaded();
    await shop.search("zzznonsensequery999");
    await shop.expectEmpty();
  });
});
