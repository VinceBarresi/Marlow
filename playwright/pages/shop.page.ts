import { expect, type Page } from "@playwright/test";

export class ShopPage {
  readonly path = "/";

  constructor(private readonly page: Page) {}

  async goto(query = "") {
    await this.page.goto(`${this.path}${query}`);
  }

  async search(query: string) {
    await this.page.getByTestId("shop-search").fill(query);
    await this.page.getByTestId("shop-search-submit").click();
  }

  async openFirstProduct() {
    await this.page.locator("[data-testid^=product-card-]").first().click();
  }

  async openFirstCategory() {
    await this.page.locator("[data-testid^=category-link-]").first().click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("shop-title")).toHaveText("Shop", { timeout: 20000 });
    await expect(this.page).toHaveURL(/\/$/);
  }

  async expectProductGrid() {
    await expect(this.page.getByTestId("shop-grid")).toBeVisible({ timeout: 20000 });
    await expect(this.page.getByTestId("shop-count")).toBeVisible();
    await expect(this.page.locator("[data-testid^=product-card-]").first()).toBeVisible();
  }

  async expectEmpty() {
    await expect(this.page.getByTestId("shop-empty")).toBeVisible({ timeout: 20000 });
  }
}
