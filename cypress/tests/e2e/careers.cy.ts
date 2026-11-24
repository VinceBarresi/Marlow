import { ApplyPage, CareersPage } from "../../pages/careers";
import { loginAsCustomer } from "../../support/login";

describe("careers", () => {
  it("lists jobs and opens an apply form", () => {
    loginAsCustomer();
    CareersPage.visit();

    cy.get(CareersPage.title, { timeout: 20000 }).should("have.text", "Careers");
    cy.get(CareersPage.grid).should("be.visible");
    cy.get(CareersPage.jobCard).should("have.length.at.least", 1);

    CareersPage.openSoftwareEngineerOrFirst();
    cy.get(ApplyPage.form, { timeout: 20000 }).should("be.visible");
    cy.get(ApplyPage.title).should("be.visible");
  });
});
