import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { ordersEndpoints } from "../../../fixtures/endpoints/ordersEndpoints";
import {
  emptyCartResponseModel,
  emptyOrdersListResponseModel,
} from "../../../fixtures/models/ordersModel";

describe("orders and cart API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    }).its("status").should("eq", 200);
  });

  it("returns an empty cart for a fresh session", () => {
    cy.request("GET", ordersEndpoints.cart).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.all.keys("items", "subtotalCents");
      expect(response.body).to.deep.include(emptyCartResponseModel);
      expect(response.body.items).to.deep.equal([]);
    });
  });

  it("returns an empty orders list for an unknown status", () => {
    cy.request("GET", `${ordersEndpoints.orders}?status=no_such_status&page=1&pageSize=20`).then(
      (response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.all.keys("orders", "page", "pageSize", "total");
        expect(response.body).to.deep.include(emptyOrdersListResponseModel);
        expect(response.body.orders).to.deep.equal([]);
      },
    );
  });

  it("rejects cart without a session", () => {
    cy.clearCookies();
    cy.request({ method: "GET", url: ordersEndpoints.cart, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("error");
      },
    );
  });
});
