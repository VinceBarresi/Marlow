import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  adminLoginResponseModel,
  customerLoginResponseModel,
  loginUnauthorizedErrorModel,
  loginValidationErrorModel,
  type LoginRequestModel,
  type LoginResponseModel,
} from "../../../fixtures/models/loginModel";
import { errorSchema, userResponseSchema } from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

const customerLoginRequest: LoginRequestModel = {
  email: "customer@marlow.test",
  password: "datalab",
};

const adminLoginRequest: LoginRequestModel = {
  email: "admin@marlow.test",
  password: "datalab",
};

const expectLoginResponse = (
  body: unknown,
  expectedUser: Omit<LoginResponseModel["user"], "id">,
) => {
  const parsed = assertSchema(userResponseSchema, body, "login");
  expect(parsed.user).to.include(expectedUser);
};

describe("login", () => {
  it("returns the customer", () => {
    cy.request("POST", loginEndpoints.login, customerLoginRequest).then((response) => {
      expect(response.status).to.eq(200);
      expectLoginResponse(response.body, customerLoginResponseModel.user);
    });
  });

  it("returns the admin", () => {
    cy.request("POST", loginEndpoints.login, adminLoginRequest).then((response) => {
      expect(response.status).to.eq(200);
      expectLoginResponse(response.body, adminLoginResponseModel.user);
    });
  });

  it("rejects a wrong password", () => {
    cy.request({
      method: "POST",
      url: loginEndpoints.login,
      body: { email: "customer@marlow.test", password: "wrong-password" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      assertSchema(errorSchema, response.body, "login unauthorized");
      expect(response.body).to.deep.equal(loginUnauthorizedErrorModel);
    });
  });

  it("rejects empty credentials", () => {
    cy.request({
      method: "POST",
      url: loginEndpoints.login,
      body: { email: "", password: "" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      assertSchema(errorSchema, response.body, "login validation");
      expect(response.body).to.deep.equal(loginValidationErrorModel);
    });
  });
});
