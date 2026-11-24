import { ShopPage } from "../../pages/shop";
import { Shell } from "../../pages/shell";
import { loginAsCustomer } from "../../support/login";

describe("shop", () => {
  it("signs in through the API and opens the shop", () => {
    loginAsCustomer();
    ShopPage.visit();

    cy.location("pathname").should("eq", "/");
    cy.get(Shell.navUser, { timeout: 20000 }).should("contain", "customer@marlow.test");
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
  });

  it("shows a product grid and count", () => {
    loginAsCustomer();
    ShopPage.visit();

    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
    cy.get(ShopPage.grid).should("be.visible");
    cy.get(ShopPage.count).should("be.visible");
    cy.get(ShopPage.productCard).should("have.length.at.least", 1);
  });

  it("shows shop-empty for a nonsense search", () => {
    loginAsCustomer();
    ShopPage.visit();
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");

    ShopPage.search("zzznonsensequery999");

    cy.get(ShopPage.empty, { timeout: 20000 }).should("be.visible");
  });
});
