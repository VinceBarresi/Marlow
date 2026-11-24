export class AccountScreen {
  get tabAccount() {
    return $("~tab-account");
  }

  get name() {
    return $("~account-name");
  }

  get email() {
    return $("~account-email");
  }

  get logout() {
    return $("~account-logout");
  }

  async open() {
    await this.tabAccount.click();
    await this.email.waitForDisplayed({ timeout: 15000 });
  }

  async signOut() {
    await this.open();
    await this.logout.click();
  }
}

export const accountScreen = new AccountScreen();
