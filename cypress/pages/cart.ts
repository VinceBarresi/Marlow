export class CartPage {
  static path = "/cart";

  static title = "[data-testid=cart-title]";
  static empty = "[data-testid=cart-empty]";
  static browse = "[data-testid=cart-browse]";
  static table = "[data-testid=cart-table]";
  static subtotal = "[data-testid=cart-subtotal]";
  static checkout = "[data-testid=cart-checkout]";

  static visit() {
    cy.visit(CartPage.path);
  }

  static goToCheckout() {
    cy.get(CartPage.checkout).click();
  }
}
