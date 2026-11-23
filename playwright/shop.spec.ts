import { expect, test } from "@playwright/test";

test("signs in through the API and opens the shop", async ({ page }) => {
  const response = await page.request.post("/api/login", {
    data: { email: "customer@marlow.test", password: "datalab" },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page.getByTestId("nav-user")).toContainText("customer@marlow.test");
  await expect(page.getByTestId("shop-title")).toHaveText("Shop", { timeout: 20000 });
  await expect(page).toHaveURL(/\/$/);
});
