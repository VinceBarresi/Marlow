import { ApplicationsPage } from "../../pages/applications";
import { loginAsStaff } from "../../support/login";

describe("staff applications", () => {
  it("shows applications title with table or empty state", () => {
    loginAsStaff();
    ApplicationsPage.visit();

    cy.get(ApplicationsPage.title, { timeout: 20000 }).should("have.text", "Applications");
    cy.get("body").then(($body) => {
      const hasTable = $body.find(ApplicationsPage.table).length > 0;
      const hasEmpty = $body.find(ApplicationsPage.empty).length > 0;
      expect(hasTable || hasEmpty).to.eq(true);
    });
  });
});
