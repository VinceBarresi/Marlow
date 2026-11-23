import { expect, test } from "@playwright/test";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import {
  adminLoginResponseModel,
  customerLoginResponseModel,
  loginUnauthorizedErrorModel,
  loginValidationErrorModel,
  type LoginRequestModel,
  type LoginResponseModel,
} from "../../fixtures/models/loginModel";

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
  expect(body).toEqual(expect.any(Object));
  expect(Object.keys(body as object).sort()).toEqual(["user"]);

  const { user } = body as LoginResponseModel;
  expect(user).toEqual(expect.any(Object));
  expect(Object.keys(user).sort()).toEqual(["email", "id", "name", "role"]);
  expect(user.id).toEqual(expect.any(String));
  expect(user.id).not.toEqual("");
  expect(user).toMatchObject(expectedUser);
};

test.describe("login", () => {
  test("returns the customer", async ({ request }) => {
    const response = await request.post(loginEndpoints.login, {
      data: customerLoginRequest,
    });

    expect(response.status()).toBe(200);
    expectLoginResponse(await response.json(), customerLoginResponseModel.user);
  });

  test("returns the admin", async ({ request }) => {
    const response = await request.post(loginEndpoints.login, {
      data: adminLoginRequest,
    });

    expect(response.status()).toBe(200);
    expectLoginResponse(await response.json(), adminLoginResponseModel.user);
  });

  test("rejects a wrong password", async ({ request }) => {
    const response = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "wrong-password" },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual(loginUnauthorizedErrorModel);
  });

  test("rejects empty credentials", async ({ request }) => {
    const response = await request.post(loginEndpoints.login, {
      data: { email: "", password: "" },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual(loginValidationErrorModel);
  });
});
