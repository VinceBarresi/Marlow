export class AdminPage {
  static path = "/admin";

  static title = "[data-testid=admin-title]";
  static lede = "[data-testid=admin-lede]";
  static card = "[data-testid=admin-card]";
  static name = "[data-testid=admin-name]";
  static console = "[data-testid=admin-console]";

  static visit() {
    cy.visit(AdminPage.path);
  }
}
