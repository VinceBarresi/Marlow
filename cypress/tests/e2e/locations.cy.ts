import { LocationPage, LocationsPage } from "../../pages/locations";
import { loginAsCustomer } from "../../support/login";

describe("locations", () => {
  it("lists locations and opens a detail page", () => {
    loginAsCustomer();
    LocationsPage.visit();

    cy.get(LocationsPage.title, { timeout: 20000 }).should("have.text", "Locations");
    cy.get(LocationsPage.grid).should("be.visible");
    cy.get(LocationsPage.card).should("have.length.at.least", 1);

    LocationsPage.openFirstLocation();
    cy.get(LocationPage.name, { timeout: 20000 }).should("be.visible");
  });
});
