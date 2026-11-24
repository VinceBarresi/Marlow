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

  /**
   * Compose OutlinedTextField exposes a11y on a non-EditText ancestor; on Android
   * focus the field then type into the focused EditText.
   */
  private async fill(field: ReturnType<WebdriverIO.Browser["$"]>, value: string) {
    await field.click();
    if (driver.isAndroid) {
      // UiAutomator — focused editable child (Compose a11y id is on the wrapper).
      const edit = $("android=new UiSelector().className(\"android.widget.EditText\").focused(true)");
      await edit.waitForExist({ timeout: 5000 });
      await edit.clearValue();
      await edit.setValue(value);
      return;
    }
    await field.clearValue();
    await field.setValue(value);
  }

  async signIn(email: string, password: string) {
    await this.waitForLoaded();
    await this.fill(this.email, email);
    await this.fill(this.password, password);
    await this.submit.click();
  }
}

export const loginScreen = new LoginScreen();
