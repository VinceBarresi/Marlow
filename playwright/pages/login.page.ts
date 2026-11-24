import { expect, type Page } from "@playwright/test";

export class LoginPage {
  readonly path = "/login";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async fillCredentials(email: string, password: string) {
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-password").fill(password);
  }

  async submit() {
    await this.page.getByTestId("login-submit").click();
  }

  async signIn(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async expectErrorVisible() {
    await expect(this.page.getByTestId("login-error")).toBeVisible();
  }

  async expectOnLogin() {
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
