import { AccountPage } from "../../pages/account";
import { loginAsCustomer } from "../../support/login";

describe("account", () => {
  it("shows name, email, and role for the customer", () => {
    loginAsCustomer();
    AccountPage.visit();

    cy.get(AccountPage.title, { timeout: 20000 }).should("have.text", "Account");
    cy.get(AccountPage.name).should("have.text", "Mina Adler");
    cy.get(AccountPage.email).should("have.text", "customer@marlow.test");
    cy.get(AccountPage.role).should("have.text", "customer");
  });
});
