export class CategoryPage {
  static path = (category: string) => `/categories/${category}`;

  static title = "[data-testid=category-title]";
  static count = "[data-testid=category-count]";
  static grid = "[data-testid=category-grid]";
  static empty = "[data-testid=category-empty]";
  static shop = "[data-testid=category-shop]";
  static productCard = "[data-testid^=product-card-]";

  static visit(category: string) {
    cy.visit(CategoryPage.path(category));
  }
}
