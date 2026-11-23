import { test } from "@playwright/test";
import { CustomerPage, CustomersPage } from "../pages/customers.page";
import { loginAsStaff } from "../support/login";

test("lists customers and opens a detail page", async ({ page }) => {
  await loginAsStaff(page);
  const customers = new CustomersPage(page);
  const customer = new CustomerPage(page);

  await customers.goto();
  await customers.expectLoaded();
  await customers.openFirstCustomer();
  await customer.expectLoaded();
});
