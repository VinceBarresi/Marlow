import { InventoryPage } from "../../pages/inventory";
import { loginAsStaff } from "../../support/login";

describe("staff inventory", () => {
  it("shows inventory title and table", () => {
    loginAsStaff();
    InventoryPage.visit();

    cy.get(InventoryPage.title, { timeout: 20000 }).should("have.text", "Inventory");
    cy.get(InventoryPage.table).should("be.visible");
  });
});
