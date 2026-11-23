export class ShopPage {
  static path = "/";

  static title = "[data-testid=shop-title]";
  static count = "[data-testid=shop-count]";
  static grid = "[data-testid=shop-grid]";
  static empty = "[data-testid=shop-empty]";
  static searchInput = "[data-testid=shop-search]";
  static searchSubmit = "[data-testid=shop-search-submit]";
  static productCard = "[data-testid^=product-card-]";
  static categoryLink = "[data-testid^=category-link-]";

  static visit(query = "") {
    cy.visit(`${ShopPage.path}${query}`);
  }

  static search(query: string) {
    cy.get(ShopPage.searchInput).clear().type(query);
    cy.get(ShopPage.searchSubmit).click();
  }

  static openFirstProduct() {
    cy.get(ShopPage.productCard).first().click();
  }

  static openFirstCategory() {
    cy.get(ShopPage.categoryLink).first().click();
  }
}
