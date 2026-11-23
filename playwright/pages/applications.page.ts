import { expect, type Page } from "@playwright/test";

export class ApplicationsPage {
  readonly path = "/staff/applications";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("applications-title")).toHaveText("Applications", {
      timeout: 20000,
    });
    const table = this.page.getByTestId("applications-table");
    const empty = this.page.getByTestId("applications-empty");
    await expect(table.or(empty)).toBeVisible();
  }
}
