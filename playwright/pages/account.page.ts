import { expect, type Page } from "@playwright/test";

export class AccountPage {
  readonly path = "/account";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async expectCustomerProfile() {
    await expect(this.page.getByTestId("account-title")).toHaveText("Account", {
      timeout: 20000,
    });
    await expect(this.page.getByTestId("account-name")).toHaveText("Mina Adler");
    await expect(this.page.getByTestId("account-email")).toHaveText("customer@marlow.test");
    await expect(this.page.getByTestId("account-role")).toHaveText("customer");
  }
}
