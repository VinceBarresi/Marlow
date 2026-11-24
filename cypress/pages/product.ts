export class ProductPage {
  static path = (sku: string) => `/products/${sku}`;

  static name = "[data-testid=product-name]";
  static sku = "[data-testid=product-sku]";
  static price = "[data-testid=product-price]";
  static stock = "[data-testid=product-stock]";
  static quantity = "[data-testid=product-quantity]";
  static add = "[data-testid=product-add]";
  static back = "[data-testid=product-back]";
  static error = "[data-testid=product-error]";

  static visit(sku: string) {
    cy.visit(ProductPage.path(sku));
  }

  static addToCart() {
    cy.get(ProductPage.add).click();
  }
}
