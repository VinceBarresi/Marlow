import { expect, test } from "@playwright/test";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { sessionEndpoints } from "../../fixtures/endpoints/sessionEndpoints";
import {
  customerLoginResponseModel,
  type LoginResponseModel,
} from "../../fixtures/models/loginModel";
import {
  healthResponseModel,
  logoutResponseModel,
} from "../../fixtures/models/sessionModel";

test.describe("session API", () => {
  test("returns health", async ({ request }) => {
    const response = await request.get(sessionEndpoints.health);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["ok", "postgres", "redis"]);
    expect(body).toEqual(healthResponseModel);
  });

  test("returns the signed-in user from me", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(sessionEndpoints.me);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as LoginResponseModel;
    expect(Object.keys(body).sort()).toEqual(["user"]);
    expect(Object.keys(body.user).sort()).toEqual(["email", "id", "name", "role"]);
    expect(body.user.id).toEqual(expect.any(String));
    expect(body.user.id).not.toEqual("");
    expect(body.user).toMatchObject(customerLoginResponseModel.user);
  });

  test("rejects me without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(sessionEndpoints.me);
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });

  test("logs out and clears the session", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const logout = await request.post(sessionEndpoints.logout);
    expect(logout.status()).toBe(200);
    expect(await logout.json()).toEqual(logoutResponseModel);

    const me = await request.get(sessionEndpoints.me);
    expect(me.status()).toBe(401);
    expect(await me.json()).toHaveProperty("error");
  });
});
