import { emptyOrdersListResponseModel } from "../../../../fixtures/models/ordersModel";
import { OrdersPage } from "../../../pages/orders";
import { loginAsAdmin, loginAsCustomer } from "../../../support/login";

describe("integ empty orders", () => {
  it("shows empty orders when the orders API is stubbed", () => {
    loginAsCustomer();
    cy.intercept("GET", "/api/orders*", emptyOrdersListResponseModel).as("emptyOrders");

    OrdersPage.visitCustomer();
    cy.wait("@emptyOrders");

    cy.get(OrdersPage.title, { timeout: 20000 }).should("have.text", "Your orders");
    cy.get(OrdersPage.count).should("contain", "0 orders");
    cy.get(OrdersPage.empty).should("have.text", "You have no orders yet.");
    cy.get(OrdersPage.table).should("not.exist");
  });

  it("shows empty fulfillment when the orders API is stubbed", () => {
    loginAsAdmin();
    cy.intercept("GET", "/api/orders*", emptyOrdersListResponseModel).as("emptyOrders");

    OrdersPage.visitStaff();
    cy.wait("@emptyOrders");

    cy.get(OrdersPage.fulfillmentTitle, { timeout: 20000 }).should("have.text", "All orders");
    cy.get(OrdersPage.fulfillmentCount).should("contain", "0 orders");
    cy.get(OrdersPage.fulfillmentEmpty).should("have.text", "No orders yet.");
    cy.get(OrdersPage.fulfillmentTable).should("not.exist");
  });
});
