import { expect, type Page } from "@playwright/test";

export class AdminPage {
  readonly path = "/admin";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("admin-title")).toHaveText("Admin", { timeout: 20000 });
    await expect(this.page).toHaveURL(/\/admin$/);
  }

  async expectRedirectedAway() {
    await expect(this.page).not.toHaveURL(/\/admin$/);
    await expect(this.page.getByTestId("admin-title")).toHaveCount(0);
  }
}
