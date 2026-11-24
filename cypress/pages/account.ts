export class AccountPage {
  static path = "/account";

  static title = "[data-testid=account-title]";
  static lede = "[data-testid=account-lede]";
  static card = "[data-testid=account-card]";
  static name = "[data-testid=account-name]";
  static email = "[data-testid=account-email]";
  static role = "[data-testid=account-role]";

  static visit() {
    cy.visit(AccountPage.path);
  }
}
