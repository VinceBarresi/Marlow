import { catalogEndpoints } from "../../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../../fixtures/endpoints/ordersEndpoints";
import {
  cartItemKeys,
  emptyCartResponseModel,
} from "../../../fixtures/models/ordersModel";

const clearCart = () => {
  cy.request("GET", ordersEndpoints.cart).then((response) => {
    expect(response.status).to.eq(200);
    for (const item of response.body.items as { sku: string }[]) {
      cy.request("DELETE", ordersEndpoints.cartItem(item.sku)).its("status").should("eq", 200);
    }
  });
};

const firstAvailableSku = () =>
  cy.request("GET", catalogEndpoints.products).then((response) => {
    expect(response.status).to.eq(200);
    const product = (response.body.products as { sku: string; available: number }[]).find(
      (row) => row.available > 0,
    );
    expect(product, "an in-stock product").to.exist;
    return product!.sku;
  });

describe("cart API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);
    clearCart();
  });

  it("puts an item, returns it in the cart, then deletes it", () => {
    firstAvailableSku().then((sku) => {
      cy.request("PUT", ordersEndpoints.cartItems, { sku, quantity: 1 }).then((put) => {
        expect(put.status).to.eq(200);
        expect(put.body).to.deep.include({ ok: true, sku, quantity: 1 });
      });

      cy.request("GET", ordersEndpoints.cart).then((cart) => {
        expect(cart.status).to.eq(200);
        expect(cart.body).to.have.all.keys("items", "subtotalCents");
        expect(cart.body.items).to.have.length(1);
        expect(cart.body.items[0]).to.have.all.keys(...cartItemKeys);
        expect(cart.body.items[0].sku).to.eq(sku);
        expect(cart.body.items[0].quantity).to.eq(1);
        expect(cart.body.subtotalCents).to.be.a("number").and.be.greaterThan(0);
      });

      cy.request("DELETE", ordersEndpoints.cartItem(sku)).then((del) => {
        expect(del.status).to.eq(200);
        expect(del.body).to.deep.equal({ ok: true });
      });

      cy.request("GET", ordersEndpoints.cart).then((empty) => {
        expect(empty.status).to.eq(200);
        expect(empty.body).to.deep.include(emptyCartResponseModel);
        expect(empty.body.items).to.deep.equal([]);
      });
    });
  });

  it("rejects cart mutations without a session", () => {
    cy.clearCookies();
    cy.request({
      method: "PUT",
      url: ordersEndpoints.cartItems,
      body: { sku: "ANY", quantity: 1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property("error");
    });
  });
});
