import { catalogEndpoints } from "../../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  categoryListSchema,
  errorSchema,
  inventoryListSchema,
  productListSchema,
  productResponseSchema,
} from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("catalog API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);
  });

  it("lists products and returns a product by sku", () => {
    cy.request("GET", catalogEndpoints.products).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(productListSchema, response.body, "products");
      expect(list.products).to.not.have.length(0);

      const product = list.products[0];

      cy.request("GET", catalogEndpoints.product(product.sku)).then((detail) => {
        expect(detail.status).to.eq(200);
        const parsed = assertSchema(productResponseSchema, detail.body, "product");
        expect(parsed.product.sku).to.eq(product.sku);
      });
    });
  });

  it("lists categories", () => {
    cy.request("GET", catalogEndpoints.categories).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(categoryListSchema, response.body, "categories");
      expect(list.categories).to.not.have.length(0);
    });
  });

  it("rejects products without a session", () => {
    cy.clearCookies();
    cy.request({
      method: "GET",
      url: catalogEndpoints.products,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      assertSchema(errorSchema, response.body, "products unauthorized");
    });
  });

  it("rejects inventory for a customer", () => {
    cy.request({
      method: "GET",
      url: catalogEndpoints.inventory,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
      assertSchema(errorSchema, response.body, "inventory forbidden");
      expect(response.body).to.deep.equal({ error: "Staff only." });
    });
  });

  it("lists inventory for staff", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "staff@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    cy.request("GET", catalogEndpoints.inventory).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(inventoryListSchema, response.body, "inventory");
      expect(list.inventory).to.not.have.length(0);
    });
  });
});
