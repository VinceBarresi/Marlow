export class ApplicationsPage {
  static path = "/staff/applications";

  static title = "[data-testid=applications-title]";
  static table = "[data-testid=applications-table]";
  static empty = "[data-testid=applications-empty]";
  static error = "[data-testid=applications-error]";

  static visit() {
    cy.visit(ApplicationsPage.path);
  }
}
