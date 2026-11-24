import { catalogEndpoints } from "../../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  locationsEndpoints,
  seedLocationSlug,
} from "../../../fixtures/endpoints/locationsEndpoints";
import { ordersEndpoints } from "../../../fixtures/endpoints/ordersEndpoints";
import {
  checkoutOrderKeys,
  shipCheckoutRequestModel,
  shipRequestModel,
} from "../../../fixtures/models/ordersModel";

const clearCart = () => {
  cy.request("GET", ordersEndpoints.cart).then((response) => {
    expect(response.status).to.eq(200);
    for (const item of response.body.items as { sku: string }[]) {
      cy.request("DELETE", ordersEndpoints.cartItem(item.sku)).its("status").should("eq", 200);
    }
  });
};

const loginAs = (email: string) => {
  cy.request("POST", loginEndpoints.login, { email, password: "datalab" })
    .its("status")
    .should("eq", 200);
};

const firstWarehouseSku = () =>
  cy.request("GET", catalogEndpoints.products).then((response) => {
    expect(response.status).to.eq(200);
    const product = (response.body.products as { sku: string; available: number }[]).find(
      (row) => row.available > 0,
    );
    expect(product, "an in-stock warehouse product").to.not.equal(undefined);
    return product!.sku;
  });

const createShipOrder = () => {
  loginAs("customer@marlow.test");
  clearCart();
  return firstWarehouseSku().then((sku) => {
    cy.request("PUT", ordersEndpoints.cartItems, { sku, quantity: 1 })
      .its("status")
      .should("eq", 200);
    return cy
      .request("POST", ordersEndpoints.checkout, shipCheckoutRequestModel)
      .then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.all.keys("order");
        expect(response.body.order).to.have.all.keys(...checkoutOrderKeys);
        expect(response.body.order.status).to.eq("paid");
        expect(response.body.order.number).to.be.a("string").and.not.equal("");
        return response.body.order.number as string;
      });
  });
};

describe("checkout and fulfillment API", () => {
  it("gets order detail after checkout", () => {
    createShipOrder().then((number) => {
      cy.request("GET", ordersEndpoints.order(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.all.keys("order");
        expect(response.body.order.number).to.eq(number);
        expect(response.body.order.status).to.eq("paid");
        expect(response.body.order.fulfillment).to.eq("ship");
        expect(response.body.order.lines).to.be.an("array").and.not.have.length(0);
      });
    });
  });

  it("cancels a paid order", () => {
    createShipOrder().then((number) => {
      cy.request("POST", ordersEndpoints.cancel(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal({ number, status: "cancelled" });
      });

      cy.request("GET", ordersEndpoints.order(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.order.status).to.eq("cancelled");
      });
    });
  });

  it("picks, ships, updates tracking, goes out for delivery, and delivers", () => {
    createShipOrder().then((number) => {
      loginAs("staff@marlow.test");

      cy.request("POST", ordersEndpoints.pick(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal({ number, status: "picking" });
      });

      cy.request("POST", ordersEndpoints.ship(number), shipRequestModel).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.include({
          number,
          status: "shipped",
          carrier: shipRequestModel.carrier,
          service: shipRequestModel.service,
        });
        expect(response.body.trackingNumber).to.be.a("string").and.not.equal("");
      });

      const trackingNumber = `TESTTRACK${Date.now()}`;
      cy.request("POST", ordersEndpoints.tracking(number), { trackingNumber }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal({ number, trackingNumber });
      });

      cy.request("POST", ordersEndpoints.outForDelivery(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal({ number, status: "out_for_delivery" });
      });

      cy.request("POST", ordersEndpoints.deliver(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.equal({ number, status: "delivered" });
      });

      cy.request("GET", ordersEndpoints.order(number)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.order.status).to.eq("delivered");
        expect(response.body.order.shipment.trackingNumber).to.eq(trackingNumber);
      });
    });
  });

  it("checks out for pickup and staff collects", () => {
    loginAs("customer@marlow.test");
    clearCart();

    cy.request("GET", locationsEndpoints.locations).then((locationsResponse) => {
      expect(locationsResponse.status).to.eq(200);
      const store = (locationsResponse.body.locations as { id: string; slug: string }[]).find(
        (row) => row.slug === seedLocationSlug,
      );
      expect(store, "seed austin-domain location").to.not.equal(undefined);

      cy.request("GET", locationsEndpoints.location(seedLocationSlug)).then((detail) => {
        expect(detail.status).to.eq(200);
        const product = (detail.body.products as { sku: string; onHand: number }[]).find(
          (row) => row.onHand > 0,
        );
        expect(product, "in-stock location product").to.not.equal(undefined);

        cy.request("PUT", ordersEndpoints.cartItems, {
          sku: product!.sku,
          quantity: 1,
        })
          .its("status")
          .should("eq", 200);

        cy.request("POST", ordersEndpoints.checkout, {
          fulfillment: "pickup",
          locationId: store!.id,
          shipName: "Mina Adler",
        }).then((checkout) => {
          expect(checkout.status).to.eq(201);
          expect(checkout.body.order.status).to.eq("paid");
          const number = checkout.body.order.number as string;

          loginAs("staff@marlow.test");
          cy.request("POST", ordersEndpoints.collect(number)).then((collect) => {
            expect(collect.status).to.eq(200);
            expect(collect.body).to.deep.equal({ number, status: "delivered" });
          });
        });
      });
    });
  });

  it("rejects pick for a customer", () => {
    createShipOrder().then((number) => {
      cy.request({
        method: "POST",
        url: ordersEndpoints.pick(number),
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403);
        expect(response.body).to.deep.equal({ error: "Staff only." });
      });

      loginAs("staff@marlow.test");
      cy.request("POST", ordersEndpoints.cancel(number)).its("status").should("eq", 200);
    });
  });
});
