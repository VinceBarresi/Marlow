import { test } from "@playwright/test";
import { ApplicationsPage } from "../pages/applications.page";
import { loginAsStaff } from "../support/login";

test("shows applications title with table or empty state", async ({ page }) => {
  await loginAsStaff(page);
  const applications = new ApplicationsPage(page);
  await applications.goto();
  await applications.expectLoaded();
});
