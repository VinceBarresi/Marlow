import { expect, type Page } from "@playwright/test";

export class ShellPage {
  constructor(private readonly page: Page) {}

  async expectNavUserContains(text: string) {
    await expect(this.page.getByTestId("nav-user")).toContainText(text);
  }
}
