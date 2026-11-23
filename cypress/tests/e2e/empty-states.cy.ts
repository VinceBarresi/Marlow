import { CartPage } from "../../pages/cart";
import { OrdersPage } from "../../pages/orders";
import { loginAsAdmin, loginAsCustomer } from "../../support/login";

describe("empty cart and orders states", () => {
  it("shows an empty cart after sign-in", () => {
    loginAsCustomer();
    CartPage.visit();

    cy.get(CartPage.title, { timeout: 20000 }).should("have.text", "Cart");
    cy.get(CartPage.empty).should("contain", "The cart is empty.");
    cy.get(CartPage.browse).should("contain", "Browse the shop.");
  });

  it("shows filtered empty orders for the customer", () => {
    loginAsCustomer();
    OrdersPage.visitCustomer("?status=no_such_status");

    cy.get(OrdersPage.title, { timeout: 20000 }).should("have.text", "Your orders");
    cy.get(OrdersPage.count).should("contain", "0 orders");
    cy.get(OrdersPage.empty).should("have.text", "No orders with that status.");
  });

  it("shows filtered empty fulfillment for staff", () => {
    loginAsAdmin();
    OrdersPage.visitStaff("?status=no_such_status");

    cy.get(OrdersPage.fulfillmentTitle, { timeout: 20000 }).should("have.text", "All orders");
    cy.get(OrdersPage.fulfillmentEmpty).should("have.text", "No orders with that status.");
  });
});
