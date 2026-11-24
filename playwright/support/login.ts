import { expect, type Page } from "@playwright/test";

export async function loginAsCustomer(page: Page) {
  const response = await page.request.post("/api/login", {
    data: { email: "customer@marlow.test", password: "datalab" },
  });
  expect(response.ok()).toBeTruthy();
}

export async function loginAsAdmin(page: Page) {
  const response = await page.request.post("/api/login", {
    data: { email: "admin@marlow.test", password: "datalab" },
  });
  expect(response.ok()).toBeTruthy();
}
