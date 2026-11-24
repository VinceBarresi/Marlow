import { customersEndpoints } from "../../../fixtures/endpoints/customersEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  customerDetailKeys,
  customerListItemKeys,
  customerOrderKeys,
} from "../../../fixtures/models/customersModel";
import { customerListSchema, errorSchema } from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("customers API", () => {
  it("rejects customers for a customer role", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    cy.request({
      method: "GET",
      url: customersEndpoints.customers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
      assertSchema(errorSchema, response.body, "customers forbidden");
      expect(response.body).to.deep.equal({ error: "Staff only." });
    });
  });

  it("rejects customers without a session", () => {
    cy.request({
      method: "GET",
      url: customersEndpoints.customers,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      assertSchema(errorSchema, response.body, "customers unauthorized");
    });
  });

  it("lists customers and returns a customer by id for staff", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "staff@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    cy.request("GET", customersEndpoints.customers).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(customerListSchema, response.body, "customers");
      expect(list.customers).to.not.have.length(0);

      const customer =
        list.customers.find((row) => row.email === "customer@marlow.test") ?? list.customers[0];
      expect(customer).to.have.all.keys(...customerListItemKeys);
      expect(customer.id).to.be.a("string").and.not.equal("");

      cy.request("GET", customersEndpoints.customer(customer.id)).then((detail) => {
        expect(detail.status).to.eq(200);
        expect(detail.body).to.have.all.keys("customer", "orders");
        expect(detail.body.customer).to.have.all.keys(...customerDetailKeys);
        expect(detail.body.customer.id).to.eq(customer.id);
        expect(detail.body.orders).to.be.an("array");
        if (detail.body.orders.length > 0) {
          expect(detail.body.orders[0]).to.have.all.keys(...customerOrderKeys);
        }
      });
    });
  });
});
