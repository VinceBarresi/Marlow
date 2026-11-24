import { loginAsCustomer } from "../../../support/login";
import { Orders } from "../../../pages/orders";

describe("orders empty (mock UI)", () => {
  it("shows the empty state when the orders API returns no rows", () => {
    loginAsCustomer();

    cy.intercept("GET", "/api/orders*", {
      statusCode: 200,
      body: { orders: [], total: 0 },
    }).as("emptyOrders");

    Orders.visit();
    cy.wait("@emptyOrders");

    cy.get(Orders.title, { timeout: 20000 }).should("have.text", "Your orders");
    cy.get(Orders.count).should("have.text", "0 orders");
    cy.get(Orders.empty).should("have.text", "You have no orders yet.");
  });
});
