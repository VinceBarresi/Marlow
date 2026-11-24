import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../../fixtures/endpoints/ordersEndpoints";
import {
  emptyCartResponseModel,
  emptyOrdersListResponseModel,
} from "../../../fixtures/models/ordersModel";
import { cartSchema, errorSchema, orderListSchema } from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("orders and cart API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);
  });

  it("returns an empty cart for a fresh session", () => {
    cy.request("GET", ordersEndpoints.cart).then((response) => {
      expect(response.status).to.eq(200);
      const body = assertSchema(cartSchema, response.body, "cart");
      expect(body).to.deep.include(emptyCartResponseModel);
      expect(body.items).to.deep.equal([]);
    });
  });

  it("returns an empty orders list for an unknown status", () => {
    cy.request("GET", `${ordersEndpoints.orders}?status=no_such_status&page=1&pageSize=20`).then(
      (response) => {
        expect(response.status).to.eq(200);
        const body = assertSchema(orderListSchema, response.body, "orders");
        expect(body).to.deep.include(emptyOrdersListResponseModel);
        expect(body.orders).to.deep.equal([]);
      },
    );
  });

  it("rejects cart without a session", () => {
    cy.clearCookies();
    cy.request({ method: "GET", url: ordersEndpoints.cart, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        assertSchema(errorSchema, response.body, "cart unauthorized");
      },
    );
  });
});
