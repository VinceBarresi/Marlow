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
import { errorSchema, userResponseSchema } from "../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../fixtures/schemas/assertSchema";

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
  expect(parsed.user).toMatchObject(expectedUser);
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
    const unauthorized = await response.json();
    assertSchema(errorSchema, unauthorized, "login unauthorized");
    expect(unauthorized).toEqual(loginUnauthorizedErrorModel);
  });

  test("rejects empty credentials", async ({ request }) => {
    const response = await request.post(loginEndpoints.login, {
      data: { email: "", password: "" },
    });

    expect(response.status()).toBe(400);
    const validation = await response.json();
    assertSchema(errorSchema, validation, "login validation");
    expect(validation).toEqual(loginValidationErrorModel);
  });
});
