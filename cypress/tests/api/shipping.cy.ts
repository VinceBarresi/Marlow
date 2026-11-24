describe("shipping Bearer API", () => {
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

  const createShippedOrder = () => {
    login("customer@marlow.test");
    return firstSku().then((sku) => {
      cy.request("PUT", "/api/cart/items", { sku, quantity: 1 }).its("status").should("eq", 200);
      return cy
        .request("POST", "/api/checkout", {
          fulfillment: "ship",
          shipName: "Mina Adler",
          shipLine1: "100 Congress Ave",
          shipCity: "Austin",
          shipRegion: "TX",
          shipPostalCode: "78701",
          card: {
            number: "4242424242424242",
            expMonth: 12,
            expYear: new Date().getFullYear() + 2,
            cvc: "123",
          },
          saveCard: false,
        })
        .then((checkout) => {
          expect(checkout.status).to.eq(201);
          const number = checkout.body.order.number as string;
          login("staff@marlow.test");
          cy.request("POST", `/api/orders/${number}/pick`).its("status").should("eq", 200);
          return cy
            .request("POST", `/api/orders/${number}/ship`, { carrier: "FedEx", service: "Ground" })
            .then((ship) => {
              expect(ship.status).to.eq(200);
              expect(ship.body.trackingNumber).to.be.a("string").and.not.equal("");
              return { number, trackingNumber: ship.body.trackingNumber as string };
            });
        });
    });
  };

  it("mints a shipping access token and tracks with Bearer", () => {
    createShippedOrder().then(({ trackingNumber }) => {
      login("customer@marlow.test");
      cy.request("POST", "/api/shipping/access-token").then((tokenResponse) => {
        expect(tokenResponse.status).to.eq(200);
        expect(tokenResponse.body).to.have.keys("accessToken", "tokenType", "expiresIn");
        expect(tokenResponse.body.tokenType).to.eq("bearer");
        expect(tokenResponse.body.accessToken).to.be.a("string").and.not.equal("");

        cy.clearCookies();
        cy.request({
          method: "GET",
          url: `/api/tracking/${encodeURIComponent(trackingNumber)}`,
          headers: { Authorization: `Bearer ${tokenResponse.body.accessToken}` },
        }).then((track) => {
          expect(track.status).to.eq(200);
          expect(track.body.tracking).to.include({
            trackingNumber,
            carrier: "FedEx",
            status: "in_transit",
          });
          expect(track.body.tracking.scans).to.be.an("array").and.not.have.length(0);
        });
      });
    });
  });

  it("rejects tracking without a session or Bearer token", () => {
    cy.clearCookies();
    cy.request({
      method: "GET",
      url: "/api/tracking/DOESNOTEXIST",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property("error");
    });
  });
});
