export class OrderPage {
  static path = (number: string) => `/orders/${number}`;

  static number = "[data-testid=order-number]";
  static status = "[data-testid=order-status]";
  static lines = "[data-testid=order-lines]";
  static total = "[data-testid=order-total]";
  static placed = "[data-testid=order-placed]";
  static error = "[data-testid=order-error]";

  static visit(number: string) {
    cy.visit(OrderPage.path(number));
  }
}
