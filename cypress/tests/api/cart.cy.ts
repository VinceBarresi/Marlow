import { catalogEndpoints } from "../../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../../fixtures/endpoints/ordersEndpoints";
import { emptyCartResponseModel } from "../../../fixtures/models/ordersModel";
import {
  cartItemResultSchema,
  cartSchema,
  errorSchema,
  okSchema,
  productListSchema,
} from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

const clearCart = () => {
  cy.request("GET", ordersEndpoints.cart).then((response) => {
    expect(response.status).to.eq(200);
    const body = assertSchema(cartSchema, response.body, "cart clear");
    for (const item of body.items) {
      cy.request("DELETE", ordersEndpoints.cartItem(item.sku)).its("status").should("eq", 200);
    }
  });
};

const firstAvailableSku = () =>
  cy.request("GET", catalogEndpoints.products).then((response) => {
    expect(response.status).to.eq(200);
    const list = assertSchema(productListSchema, response.body, "products");
    const product = list.products.find((row) => row.available > 0);
    expect(product, "an in-stock product").to.not.equal(undefined);
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
        const putBody = assertSchema(cartItemResultSchema, put.body, "cart put");
        expect(putBody).to.deep.include({ ok: true, sku, quantity: 1 });
      });

      cy.request("GET", ordersEndpoints.cart).then((cart) => {
        expect(cart.status).to.eq(200);
        const cartBody = assertSchema(cartSchema, cart.body, "cart");
        expect(cartBody.items).to.have.length(1);
        expect(cartBody.items[0].sku).to.eq(sku);
        expect(cartBody.items[0].quantity).to.eq(1);
        expect(cartBody.subtotalCents).to.be.greaterThan(0);
      });

      cy.request("DELETE", ordersEndpoints.cartItem(sku)).then((del) => {
        expect(del.status).to.eq(200);
        assertSchema(okSchema, del.body, "cart delete");
      });

      cy.request("GET", ordersEndpoints.cart).then((empty) => {
        expect(empty.status).to.eq(200);
        const emptyBody = assertSchema(cartSchema, empty.body, "empty cart");
        expect(emptyBody).to.deep.include(emptyCartResponseModel);
        expect(emptyBody.items).to.deep.equal([]);
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
      assertSchema(errorSchema, response.body, "cart unauthorized");
    });
  });
});
