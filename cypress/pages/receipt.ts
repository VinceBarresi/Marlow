export class ReceiptPage {
  static path = (number: string) => `/orders/${number}/confirmed`;

  static title = "[data-testid=receipt-title]";
  static number = "[data-testid=receipt-number]";
  static total = "[data-testid=receipt-total]";
  static card = "[data-testid=receipt-card]";
  static orderLink = "[data-testid=receipt-order]";

  static visit(number: string) {
    cy.visit(ReceiptPage.path(number));
  }
}
