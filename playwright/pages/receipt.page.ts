import { expect, type Page } from "@playwright/test";

export class ReceiptPage {
  constructor(private readonly page: Page) {}

  async goto(number: string) {
    await this.page.goto(`/orders/${number}/confirmed`);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("receipt-title")).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByTestId("receipt-number")).toBeVisible();
    await expect(this.page).toHaveURL(/\/orders\/.+\/confirmed$/);
  }
}
