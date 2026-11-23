export class InventoryPage {
  static path = "/staff/inventory";

  static title = "[data-testid=inventory-title]";
  static count = "[data-testid=inventory-count]";
  static table = "[data-testid=inventory-table]";
  static searchInput = "[data-testid=inventory-search]";
  static searchSubmit = "[data-testid=inventory-search-submit]";

  static visit(query = "") {
    cy.visit(`${InventoryPage.path}${query}`);
  }
}
