describe("payments sandbox API", () => {
  const expYear = new Date().getFullYear() + 2;

  const login = (email: string) =>
    cy
      .request("POST", "/api/login", { email, password: "datalab" })
      .its("status")
      .should("eq", 200);

  const firstSku = () =>
    cy.request("GET", "/api/products").then((response) => {
      expect(response.status).to.eq(200);
      const product = (response.body.products as { sku: string; available: number }[]).find(
        (row) => row.available > 0,
      );
      expect(product).to.not.equal(undefined);
      return product!.sku;
    });

  it("saves, lists, and removes a tokenized card", () => {
    login("customer@marlow.test");
    cy.request("POST", "/api/payment-methods", {
      card: { number: "4242424242424242", expMonth: 12, expYear, cvc: "123" },
    }).then((created) => {
      expect(created.status).to.eq(201);
      expect(created.body.paymentMethod.id).to.match(/^pm_/);
      expect(created.body.paymentMethod.card).to.include({
        brand: "visa",
        last4: "4242",
      });
      expect(created.body.paymentMethod.card).to.not.have.property("number");
      expect(created.body.paymentMethod.card).to.not.have.property("cvc");
      const id = created.body.paymentMethod.id as string;

      cy.request("GET", "/api/payment-methods").then((list) => {
        expect(list.status).to.eq(200);
        expect(list.body.paymentMethods.map((row: { id: string }) => row.id)).to.include(id);
      });

      cy.request("DELETE", `/api/payment-methods/${encodeURIComponent(id)}`).then((deleted) => {
        expect(deleted.status).to.eq(200);
        expect(deleted.body).to.deep.include({ id, deleted: true });
      });
    });
  });

  it("checks out with a successful test card", () => {
    login("customer@marlow.test");
    firstSku().then((sku) => {
      cy.request("PUT", "/api/cart/items", { sku, quantity: 1 }).its("status").should("eq", 200);
      cy.request("POST", "/api/checkout", {
        fulfillment: "ship",
        shipName: "Mina Adler",
        shipLine1: "100 Congress Ave",
        shipCity: "Austin",
        shipRegion: "TX",
        shipPostalCode: "78701",
        card: { number: "4242424242424242", expMonth: 12, expYear, cvc: "123" },
        saveCard: false,
      }).then((checkout) => {
        expect(checkout.status).to.eq(201);
        expect(checkout.body.order.number).to.match(/^MRW-/);
        expect(checkout.body.order.status).to.eq("paid");
      });
    });
  });

  it("declines checkout with the Stripe decline test card", () => {
    login("customer@marlow.test");
    firstSku().then((sku) => {
      cy.request("PUT", "/api/cart/items", { sku, quantity: 1 }).its("status").should("eq", 200);
      cy.request({
        method: "POST",
        url: "/api/checkout",
        failOnStatusCode: false,
        body: {
          fulfillment: "ship",
          shipName: "Mina Adler",
          shipLine1: "100 Congress Ave",
          shipCity: "Austin",
          shipRegion: "TX",
          shipPostalCode: "78701",
          card: { number: "4000000000000002", expMonth: 12, expYear, cvc: "123" },
        },
      }).then((checkout) => {
        expect(checkout.status).to.eq(402);
        expect(checkout.body).to.have.property("error");
        expect(checkout.body.declineCode).to.eq("card_declined");
      });
    });
  });

  it("rejects payment-methods without a session", () => {
    cy.clearCookies();
    cy.request({
      method: "GET",
      url: "/api/payment-methods",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property("error");
    });
  });
});
