import { CartPage } from "../../pages/cart";
import { CheckoutPage } from "../../pages/checkout";
import { OrdersPage } from "../../pages/orders";
import { ProductPage } from "../../pages/product";
import { ReceiptPage } from "../../pages/receipt";
import { ShopPage } from "../../pages/shop";
import { loginAsCustomer } from "../../support/login";

describe("purchase flow", () => {
  it("buys a product from shop through receipt", () => {
    loginAsCustomer();
    ShopPage.visit();
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
    cy.get(ShopPage.grid).should("be.visible");

    ShopPage.openFirstProduct();
    cy.get(ProductPage.name, { timeout: 20000 }).should("be.visible");
    ProductPage.addToCart();

    cy.get(CartPage.title, { timeout: 20000 }).should("have.text", "Cart");
    cy.get(CartPage.table).should("be.visible");
    cy.get(CartPage.subtotal).should("be.visible");
    CartPage.goToCheckout();

    cy.get(CheckoutPage.title, { timeout: 20000 }).should("have.text", "Checkout");
    CheckoutPage.placeShipOrder();

    cy.get(ReceiptPage.title, { timeout: 20000 }).should("be.visible");
    cy.get(ReceiptPage.number).should("be.visible");
    cy.location("pathname").should("match", /\/orders\/.+\/confirmed$/);

    OrdersPage.visitCustomer();
    cy.get(OrdersPage.title, { timeout: 20000 }).should("have.text", "Your orders");
    cy.get(OrdersPage.table).should("be.visible");
    cy.get(OrdersPage.row).should("have.length.at.least", 1);
  });
});
