import { expect, type Page } from "@playwright/test";

export class CategoryPage {
  constructor(private readonly page: Page) {}

  async goto(category: string) {
    await this.page.goto(`/categories/${category}`);
  }

  async expectLoaded(category?: string) {
    const title = this.page.getByTestId("category-title");
    await expect(title).toBeVisible({ timeout: 20000 });
    if (category) {
      await expect(title).toHaveText(category);
    }
  }

  async expectProductGrid() {
    await expect(this.page.getByTestId("category-grid")).toBeVisible({ timeout: 20000 });
    await expect(this.page.locator("[data-testid^=product-card-]").first()).toBeVisible();
  }
}
