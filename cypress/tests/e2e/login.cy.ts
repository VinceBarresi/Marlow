import { LoginPage } from "../../pages/login";
import { Shell } from "../../pages/shell";
import { ShopPage } from "../../pages/shop";

describe("login UI", () => {
  it("shows an error for a wrong password", () => {
    LoginPage.visit();
    LoginPage.signIn("customer@marlow.test", "wrong-password");

    cy.get(LoginPage.error).should("be.visible");
    cy.location("pathname").should("eq", "/login");
  });

  it("signs in through the form and opens the shop", () => {
    LoginPage.visit();
    LoginPage.signIn("customer@marlow.test", "datalab");

    cy.location("pathname").should("eq", "/");
    cy.get(Shell.navUser).should("contain", "customer@marlow.test");
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
  });

  it("redirects signed-in customers away from login", () => {
    cy.request("POST", "/api/login", {
      email: "customer@marlow.test",
      password: "datalab",
    });
    LoginPage.visit();

    cy.location("pathname").should("eq", "/");
    cy.get(Shell.navUser).should("contain", "customer@marlow.test");
  });
});
