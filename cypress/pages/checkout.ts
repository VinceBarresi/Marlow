export class CheckoutPage {
  static path = "/checkout";

  static title = "[data-testid=checkout-title]";
  static form = "[data-testid=checkout-form]";
  static ship = "[data-testid=checkout-ship]";
  static pickup = "[data-testid=checkout-pickup]";
  static name = "[data-testid=checkout-name]";
  static address = "[data-testid=checkout-address]";
  static city = "[data-testid=checkout-city]";
  static state = "[data-testid=checkout-state]";
  static postal = "[data-testid=checkout-postal]";
  static submit = "[data-testid=checkout-submit]";
  static error = "[data-testid=checkout-error]";

  static visit() {
    cy.visit(CheckoutPage.path);
  }

  static placeShipOrder() {
    cy.get(CheckoutPage.ship).check({ force: true });
    cy.get(CheckoutPage.submit).click();
  }
}
