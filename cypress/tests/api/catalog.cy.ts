import { catalogEndpoints } from "../../../fixtures/endpoints/catalogEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  categoryKeys,
  inventoryItemKeys,
  productKeys,
} from "../../../fixtures/models/catalogModel";

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
      expect(response.body).to.have.all.keys("products", "page", "pageSize", "total");
      expect(response.body.products).to.be.an("array").and.not.have.length(0);

      const product = response.body.products[0];
      expect(product).to.have.all.keys(...productKeys);
      expect(product.sku).to.be.a("string").and.not.equal("");

      cy.request("GET", catalogEndpoints.product(product.sku)).then((detail) => {
        expect(detail.status).to.eq(200);
        expect(detail.body).to.have.all.keys("product");
        expect(detail.body.product).to.have.all.keys(...productKeys);
        expect(detail.body.product.sku).to.eq(product.sku);
      });
    });
  });

  it("lists categories", () => {
    cy.request("GET", catalogEndpoints.categories).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.all.keys("categories");
      expect(response.body.categories).to.be.an("array").and.not.have.length(0);
      expect(response.body.categories[0]).to.have.all.keys(...categoryKeys);
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
      expect(response.body).to.have.property("error");
    });
  });

  it("rejects inventory for a customer", () => {
    cy.request({
      method: "GET",
      url: catalogEndpoints.inventory,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
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
      expect(response.body).to.have.all.keys("inventory", "page", "pageSize", "total");
      expect(response.body.inventory).to.be.an("array").and.not.have.length(0);
      expect(response.body.inventory[0]).to.have.all.keys(...inventoryItemKeys);
    });
  });
});
