import { test } from "@playwright/test";
import { LocationPage, LocationsPage } from "../pages/locations.page";
import { loginAsCustomer } from "../support/login";

test("lists locations and opens a detail page", async ({ page }) => {
  await loginAsCustomer(page);
  const locations = new LocationsPage(page);
  const location = new LocationPage(page);

  await locations.goto();
  await locations.expectLoaded();
  await locations.openFirstLocation();
  await location.expectLoaded();
});
