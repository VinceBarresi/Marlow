import { expect, test } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { ShellPage } from "../pages/shell.page";
import { ShopPage } from "../pages/shop.page";
import { loginAsCustomer } from "../support/login";

test.describe("login UI", () => {
  test("shows an error for a wrong password", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn("customer@marlow.test", "wrong-password");
    await login.expectErrorVisible();
    await login.expectOnLogin();
  });

  test("signs in through the form and opens the shop", async ({ page }) => {
    const login = new LoginPage(page);
    const shop = new ShopPage(page);
    const shell = new ShellPage(page);

    await login.goto();
    await login.signIn("customer@marlow.test", "datalab");

    await expect(page).toHaveURL(/\/$/);
    await shell.expectNavUserContains("customer@marlow.test");
    await shop.expectLoaded();
  });

  test("redirects signed-in customers away from login", async ({ page }) => {
    await loginAsCustomer(page);

    const login = new LoginPage(page);
    const shell = new ShellPage(page);
    await login.goto();

    await expect(page).toHaveURL(/\/$/);
    await shell.expectNavUserContains("customer@marlow.test");
  });
});
