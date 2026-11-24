import { CategoryPage } from "../../pages/category";
import { ShopPage } from "../../pages/shop";
import { loginAsCustomer } from "../../support/login";

describe("category", () => {
  it("opens a category from the shop and shows products", () => {
    loginAsCustomer();
    ShopPage.visit();
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
    cy.get(ShopPage.categoryLink).should("have.length.at.least", 1);

    ShopPage.openFirstCategory();

    cy.location("pathname").should("match", /^\/categories\//);
    cy.get(CategoryPage.title, { timeout: 20000 }).should("be.visible");
    cy.get(CategoryPage.grid).should("be.visible");
    cy.get(CategoryPage.productCard).should("have.length.at.least", 1);
  });
});
