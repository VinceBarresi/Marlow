export class Orders {
  static title = "[data-testid=orders-title]";
  static count = "[data-testid=orders-count]";
  static empty = "[data-testid=orders-empty]";

  static visit() {
    cy.visit("/orders");
  }
}
