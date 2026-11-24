import { test } from "@playwright/test";
import { AccountPage } from "../pages/account.page";
import { loginAsCustomer } from "../support/login";

test("shows name, email, and role for the customer", async ({ page }) => {
  await loginAsCustomer(page);
  const account = new AccountPage(page);
  await account.goto();
  await account.expectCustomerProfile();
});
