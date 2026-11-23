import { expect, type Page } from "@playwright/test";

export class ProductPage {
  constructor(private readonly page: Page) {}

  async goto(sku: string) {
    await this.page.goto(`/products/${sku}`);
  }

  async addToCart() {
    await this.page.getByTestId("product-add").click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("product-name")).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByTestId("product-add")).toBeVisible();
  }
}
