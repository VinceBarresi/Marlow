export class LoginPage {
  static path = "/login";

  static page = "[data-testid=login-page]";
  static title = "[data-testid=login-title]";
  static form = "[data-testid=login-form]";
  static email = "[data-testid=login-email]";
  static password = "[data-testid=login-password]";
  static submit = "[data-testid=login-submit]";
  static error = "[data-testid=login-error]";
  static hint = "[data-testid=login-hint]";

  static visit() {
    cy.visit(LoginPage.path);
  }

  static fillCredentials(email: string, password: string) {
    cy.get(LoginPage.email).clear().type(email);
    cy.get(LoginPage.password).clear().type(password);
  }

  static submitForm() {
    cy.get(LoginPage.submit).click();
  }

  static signIn(email: string, password: string) {
    LoginPage.fillCredentials(email, password);
    LoginPage.submitForm();
  }
}
