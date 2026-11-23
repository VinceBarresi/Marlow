import { expect, type Page } from "@playwright/test";

export async function loginViaApi(
  page: Page,
  email: string,
  password = "datalab",
) {
  const response = await page.request.post("/api/login", {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}

export async function loginAsCustomer(page: Page) {
  await loginViaApi(page, "customer@marlow.test");
}

export async function loginAsStaff(page: Page) {
  await loginViaApi(page, "staff@marlow.test");
}

export async function loginAsAdmin(page: Page) {
  await loginViaApi(page, "admin@marlow.test");
}
