import { AdminPage } from "../../pages/admin";
import { loginAsAdmin, loginAsCustomer } from "../../support/login";

describe("admin", () => {
  it("shows the admin page for admins", () => {
    loginAsAdmin();
    AdminPage.visit();

    cy.get(AdminPage.title, { timeout: 20000 }).should("have.text", "Admin");
    cy.location("pathname").should("eq", "/admin");
  });

  it("redirects customers away from admin", () => {
    loginAsCustomer();
    AdminPage.visit();

    cy.location("pathname").should("not.eq", "/admin");
    cy.get(AdminPage.title).should("not.exist");
  });
});
