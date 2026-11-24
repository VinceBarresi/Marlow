export class LoginScreen {
  get email() {
    return $("~login-email");
  }

  get password() {
    return $("~login-password");
  }

  get submit() {
    return $("~login-submit");
  }

  get error() {
    return $("~login-error");
  }

  async waitForLoaded() {
    await this.email.waitForDisplayed({ timeout: 30000 });
  }

  async signIn(email: string, password: string) {
    await this.waitForLoaded();
    await this.email.clearValue();
    await this.email.setValue(email);
    await this.password.clearValue();
    await this.password.setValue(password);
    await this.submit.click();
  }
}

export const loginScreen = new LoginScreen();
