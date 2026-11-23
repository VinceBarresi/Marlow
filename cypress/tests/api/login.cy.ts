import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import {
  loginResponseModel,
  type LoginRequestModel,
  type LoginResponseModel,
} from "../../fixtures/models/loginModel";

const loginRequest: LoginRequestModel = {
  email: "customer@marlow.test",
  password: "datalab",
};

const expectLoginResponse = (body: unknown) => {
  expect(body).to.be.an("object").and.to.have.all.keys("user");

  const { user } = body as LoginResponseModel;
  expect(user).to.be.an("object").and.to.have.all.keys("email", "id", "name", "role");
  expect(user.id).to.be.a("string").and.not.equal("");
  expect(user).to.include(loginResponseModel.user);
};

describe("login", () => {
  it("returns the customer", () => {
    cy.request("POST", loginEndpoints.login, loginRequest).then((response) => {
      expect(response.status).to.eq(200);
      expectLoginResponse(response.body);
    });
  });
});
