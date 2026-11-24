import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { sessionEndpoints } from "../../../fixtures/endpoints/sessionEndpoints";
import { customerLoginResponseModel } from "../../../fixtures/models/loginModel";
import { healthResponseModel, logoutResponseModel } from "../../../fixtures/models/sessionModel";
import {
  errorSchema,
  healthSchema,
  okSchema,
  userResponseSchema,
} from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("session API", () => {
  it("returns health", () => {
    cy.request("GET", sessionEndpoints.health).then((response) => {
      expect(response.status).to.eq(200);
      assertSchema(healthSchema, response.body, "health");
      expect(response.body).to.deep.equal(healthResponseModel);
    });
  });

  it("returns the signed-in user from me", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    cy.request("GET", sessionEndpoints.me).then((response) => {
      expect(response.status).to.eq(200);
      const parsed = assertSchema(userResponseSchema, response.body, "me");
      expect(parsed.user).to.include(customerLoginResponseModel.user);
    });
  });

  it("rejects me without a session", () => {
    cy.clearCookies();
    cy.request({ method: "GET", url: sessionEndpoints.me, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        assertSchema(errorSchema, response.body, "me unauthorized");
      },
    );
  });

  it("logs out and clears the session", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    cy.request("POST", sessionEndpoints.logout).then((response) => {
      expect(response.status).to.eq(200);
      assertSchema(okSchema, response.body, "logout");
      expect(response.body).to.deep.equal(logoutResponseModel);
    });

    cy.request({ method: "GET", url: sessionEndpoints.me, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        assertSchema(errorSchema, response.body, "me after logout");
      },
    );
  });
});
