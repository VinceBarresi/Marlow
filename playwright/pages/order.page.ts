import { expect, type Page } from "@playwright/test";

export class OrderPage {
  constructor(private readonly page: Page) {}

  async goto(number: string) {
    await this.page.goto(`/orders/${number}`);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("order-number")).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByTestId("order-status")).toBeVisible();
  }
}
