import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import { sessionEndpoints } from "../../../fixtures/endpoints/sessionEndpoints";
import {
  customerLoginResponseModel,
  type LoginResponseModel,
} from "../../../fixtures/models/loginModel";
import {
  healthResponseModel,
  logoutResponseModel,
} from "../../../fixtures/models/sessionModel";

describe("session API", () => {
  it("returns health", () => {
    cy.request("GET", sessionEndpoints.health).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.all.keys("ok", "postgres", "redis");
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
      expect(response.body).to.have.all.keys("user");
      const { user } = response.body as LoginResponseModel;
      expect(user).to.have.all.keys("email", "id", "name", "role");
      expect(user.id).to.be.a("string").and.not.equal("");
      expect(user).to.include(customerLoginResponseModel.user);
    });
  });

  it("rejects me without a session", () => {
    cy.clearCookies();
    cy.request({ method: "GET", url: sessionEndpoints.me, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("error");
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
      expect(response.body).to.deep.equal(logoutResponseModel);
    });

    cy.request({ method: "GET", url: sessionEndpoints.me, failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("error");
      },
    );
  });
});
