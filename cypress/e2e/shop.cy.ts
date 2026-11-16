describe("shop", () => {
  it("signs in through the API and opens the shop", () => {
    cy.request("POST", "/api/login", {
      email: "customer@marlow.test",
      password: "datalab",
    });

    cy.visit("/");

    cy.location("pathname").should("eq", "/");
    cy.get("[data-testid=nav-user]").should("contain", "customer@marlow.test");
    cy.get("[data-testid=shop-title]", { timeout: 20000 }).should("have.text", "Shop");
  });
});
