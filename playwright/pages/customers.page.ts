import { expect, type Page } from "@playwright/test";

export class CustomersPage {
  readonly path = "/staff/customers";

  constructor(private readonly page: Page) {}

  async goto(query = "") {
    await this.page.goto(`${this.path}${query}`);
  }

  async openFirstCustomer() {
    await this.page.locator("[data-testid^=customers-link-]").first().click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("customers-title")).toHaveText("Customers", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("customers-table")).toBeVisible();
  }
}

export class CustomerPage {
  constructor(private readonly page: Page) {}

  async goto(id: string) {
    await this.page.goto(`/staff/customers/${id}`);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("customer-name")).toBeVisible({ timeout: 20000 });
  }
}
