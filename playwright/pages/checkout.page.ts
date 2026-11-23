import { expect, type Page } from "@playwright/test";

export class CheckoutPage {
  readonly path = "/checkout";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async placeShipOrder() {
    await this.page.getByTestId("checkout-ship").check();
    await this.page.getByTestId("checkout-submit").click();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("checkout-title")).toHaveText("Checkout", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("checkout-form")).toBeVisible();
  }
}
