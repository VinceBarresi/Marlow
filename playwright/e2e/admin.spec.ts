import { test } from "@playwright/test";
import { AdminPage } from "../pages/admin.page";
import { loginAsAdmin, loginAsCustomer } from "../support/login";

test.describe("admin", () => {
  test("shows the admin page for admins", async ({ page }) => {
    await loginAsAdmin(page);
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.expectLoaded();
  });

  test("redirects customers away from admin", async ({ page }) => {
    await loginAsCustomer(page);
    const admin = new AdminPage(page);
    await admin.goto();
    await admin.expectRedirectedAway();
  });
});
