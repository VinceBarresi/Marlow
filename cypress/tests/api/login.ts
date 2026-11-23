import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import type { LoginRequestModel, LoginResponseModel } from "../../fixtures/models/loginModel";

const loginRequest: LoginRequestModel = {
  email: "customer@marlow.test",
  password: "datalab",
};

const loginRequestAdmin: LoginRequestModel = {
  email: "admin@marlow.test",
  password: "datalab",
};

const expectLoginResponse = (
  body: LoginResponseModel,
  email: string,
  id: string,
  name: string,
  role: string,
) => {
  const { user } = body;
  expect(user).to.be.an("object").and.to.have.all.keys("email", "id", "name", "role");
  expect(user.email).to.be.a("string").and.not.equal("");
  expect(user.email).to.eq(email);
  expect(user.id).to.be.a("string").and.not.equal("");
  expect(user.id).to.eq(id);
  expect(user.name).to.be.a("string").and.not.equal("");
  expect(user.name).to.eq(name);
  expect(user.role).to.be.a("string").and.not.equal("");
  expect(user.role).to.eq(role);
};

describe("POST api/login", () => {
  it("returns the customer", () => {
    cy.request("POST", loginEndpoints.login, loginRequest).then((response) => {
      expect(response.status).to.eq(200);
      expectLoginResponse(
        response.body,
        "customer@marlow.test",
        "3cb48fe1-b709-44f7-9fe6-9d30c1156f4e",
        "Mina Adler",
        "customer",
      );
    });
  });

  it("returns the admin", () => {
    cy.request("POST", loginEndpoints.login, loginRequestAdmin).then((response) => {
      expect(response.status).to.eq(200);
      expectLoginResponse(
        response.body,
        "admin@marlow.test",
        "69d89a06-daf5-410d-befe-07b2326664f1",
        "Avery Chen",
        "admin",
      );
    });
  });
});
