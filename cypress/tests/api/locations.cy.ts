import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  locationsEndpoints,
  seedLocationSlug,
} from "../../../fixtures/endpoints/locationsEndpoints";
import { locationKeys, uniqueLocationRequest } from "../../../fixtures/models/locationsModel";
import { errorSchema, locationListSchema } from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("locations API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);
  });

  it("lists locations and returns a seed location by slug", () => {
    cy.request("GET", locationsEndpoints.locations).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(locationListSchema, response.body, "locations");
      expect(list.locations).to.not.have.length(0);
      expect(list.locations[0]).to.have.all.keys(...locationKeys);

      const seed = list.locations.find((row) => row.slug === seedLocationSlug);
      expect(seed, "seed austin-domain").to.not.equal(undefined);
    });

    cy.request("GET", locationsEndpoints.location(seedLocationSlug)).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.all.keys(
        "location",
        "categories",
        "products",
        "page",
        "pageSize",
        "total",
      );
      expect(response.body.location).to.have.all.keys(...locationKeys);
      expect(response.body.location.slug).to.eq(seedLocationSlug);
    });
  });

  it("rejects locations without a session", () => {
    cy.clearCookies();
    cy.request({
      method: "GET",
      url: locationsEndpoints.locations,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      assertSchema(errorSchema, response.body, "locations unauthorized");
    });
  });

  it("rejects create for a non-admin", () => {
    cy.request({
      method: "POST",
      url: locationsEndpoints.locations,
      body: uniqueLocationRequest(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body).to.deep.equal({ error: "Admin only." });
    });
  });

  it("creates and deletes a location as admin", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "admin@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    const payload = uniqueLocationRequest();
    cy.request("POST", locationsEndpoints.locations, payload).then((create) => {
      expect(create.status).to.eq(201);
      expect(create.body).to.have.all.keys("location");
      expect(create.body.location).to.have.all.keys(...locationKeys);
      expect(create.body.location.name).to.eq(payload.name);
      expect(create.body.location.slug).to.be.a("string").and.not.equal("");

      const slug = create.body.location.slug as string;
      cy.request({
        method: "DELETE",
        url: locationsEndpoints.location(slug),
      }).then((del) => {
        expect(del.status).to.eq(204);
      });

      cy.request({
        method: "GET",
        url: locationsEndpoints.location(slug),
        failOnStatusCode: false,
      }).then((missing) => {
        expect(missing.status).to.eq(404);
        expect(missing.body).to.have.property("error");
      });
    });
  });
});
