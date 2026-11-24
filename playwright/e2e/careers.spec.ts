import { test } from "@playwright/test";
import { ApplyPage, CareersPage } from "../pages/careers.page";
import { loginAsCustomer } from "../support/login";

test("lists jobs and opens an apply form", async ({ page }) => {
  await loginAsCustomer(page);
  const careers = new CareersPage(page);
  const apply = new ApplyPage(page);

  await careers.goto();
  await careers.expectLoaded();
  await careers.openSoftwareEngineerOrFirst();
  await apply.expectFormVisible();
});
