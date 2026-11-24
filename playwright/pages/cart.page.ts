import { expect, type Page } from "@playwright/test";

export class CartPage {
  readonly path = "/cart";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async goToCheckout() {
    await this.page.getByTestId("cart-checkout").click();
  }

  async expectEmpty() {
    await expect(this.page.getByTestId("cart-title")).toHaveText("Cart", { timeout: 20000 });
    await expect(this.page.getByTestId("cart-empty")).toContainText("The cart is empty.");
    await expect(this.page.getByTestId("cart-browse")).toContainText("Browse the shop.");
  }

  async expectHasItems() {
    await expect(this.page.getByTestId("cart-title")).toHaveText("Cart", { timeout: 20000 });
    await expect(this.page.getByTestId("cart-table")).toBeVisible();
    await expect(this.page.getByTestId("cart-subtotal")).toBeVisible();
  }
}
