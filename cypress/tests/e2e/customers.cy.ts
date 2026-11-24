import { CustomerPage, CustomersPage } from "../../pages/customers";
import { loginAsStaff } from "../../support/login";

describe("staff customers", () => {
  it("lists customers and opens a detail page", () => {
    loginAsStaff();
    CustomersPage.visit();

    cy.get(CustomersPage.title, { timeout: 20000 }).should("have.text", "Customers");
    cy.get(CustomersPage.table).should("be.visible");
    cy.get(CustomersPage.link).should("have.length.at.least", 1);

    CustomersPage.openFirstCustomer();
    cy.get(CustomerPage.name, { timeout: 20000 }).should("be.visible");
  });
});
