import { expect, test } from "@playwright/test";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { sessionEndpoints } from "../../fixtures/endpoints/sessionEndpoints";
import { customerLoginResponseModel } from "../../fixtures/models/loginModel";
import { healthResponseModel, logoutResponseModel } from "../../fixtures/models/sessionModel";
import {
  errorSchema,
  healthSchema,
  okSchema,
  userResponseSchema,
} from "../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../fixtures/schemas/assertSchema";

test.describe("session API", () => {
  test("returns health", async ({ request }) => {
    const response = await request.get(sessionEndpoints.health);
    expect(response.status()).toBe(200);

    const body = await response.json();
    assertSchema(healthSchema, body, "health");
    expect(body).toEqual(healthResponseModel);
  });

  test("returns the signed-in user from me", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(sessionEndpoints.me);
    expect(response.status()).toBe(200);

    const parsed = assertSchema(userResponseSchema, await response.json(), "me");
    expect(parsed.user).toMatchObject(customerLoginResponseModel.user);
  });

  test("rejects me without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(sessionEndpoints.me);
    expect(response.status()).toBe(401);
    assertSchema(errorSchema, await response.json(), "me unauthorized");
    await anon.dispose();
  });

  test("logs out and clears the session", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const logout = await request.post(sessionEndpoints.logout);
    expect(logout.status()).toBe(200);
    const logoutBody = await logout.json();
    assertSchema(okSchema, logoutBody, "logout");
    expect(logoutBody).toEqual(logoutResponseModel);

    const me = await request.get(sessionEndpoints.me);
    expect(me.status()).toBe(401);
    assertSchema(errorSchema, await me.json(), "me after logout");
  });
});
