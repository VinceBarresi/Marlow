import { expect, type Page } from "@playwright/test";

export class InventoryPage {
  readonly path = "/staff/inventory";

  constructor(private readonly page: Page) {}

  async goto(query = "") {
    await this.page.goto(`${this.path}${query}`);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("inventory-title")).toHaveText("Inventory", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("inventory-table")).toBeVisible();
  }
}
