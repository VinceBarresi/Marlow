import { expect, type Page } from "@playwright/test";

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/orders");
  }

  async expectEmpty() {
    await expect(this.page.getByTestId("orders-title")).toHaveText("Your orders", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("orders-count")).toHaveText("0 orders");
    await expect(this.page.getByTestId("orders-empty")).toHaveText("You have no orders yet.");
  }
}
