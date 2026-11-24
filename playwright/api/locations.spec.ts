import { expect, test } from "@playwright/test";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { locationsEndpoints, seedLocationSlug } from "../../fixtures/endpoints/locationsEndpoints";
import { locationKeys, uniqueLocationRequest } from "../../fixtures/models/locationsModel";

test.describe("locations API", () => {
  test.beforeEach(async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);
  });

  test("lists locations and returns a seed location by slug", async ({ request }) => {
    const response = await request.get(locationsEndpoints.locations);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["locations"]);
    expect(body.locations.length).toBeGreaterThan(0);
    expect(Object.keys(body.locations[0]).sort()).toEqual([...locationKeys].sort());
    expect(body.locations.some((row: { slug: string }) => row.slug === seedLocationSlug)).toBe(
      true,
    );

    const detail = await request.get(locationsEndpoints.location(seedLocationSlug));
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    expect(Object.keys(detailBody).sort()).toEqual([
      "categories",
      "location",
      "page",
      "pageSize",
      "products",
      "total",
    ]);
    expect(Object.keys(detailBody.location).sort()).toEqual([...locationKeys].sort());
    expect(detailBody.location.slug).toBe(seedLocationSlug);
  });

  test("rejects locations without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(locationsEndpoints.locations);
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });

  test("rejects create for a non-admin", async ({ request }) => {
    const response = await request.post(locationsEndpoints.locations, {
      data: uniqueLocationRequest(),
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Admin only." });
  });

  test("creates and deletes a location as admin", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "admin@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const payload = uniqueLocationRequest();
    const create = await request.post(locationsEndpoints.locations, { data: payload });
    expect(create.status()).toBe(201);

    const created = await create.json();
    expect(Object.keys(created).sort()).toEqual(["location"]);
    expect(Object.keys(created.location).sort()).toEqual([...locationKeys].sort());
    expect(created.location.name).toBe(payload.name);
    expect(created.location.slug).toEqual(expect.any(String));
    expect(created.location.slug).not.toEqual("");

    const slug = created.location.slug as string;
    const del = await request.delete(locationsEndpoints.location(slug));
    expect(del.status()).toBe(204);

    const missing = await request.get(locationsEndpoints.location(slug));
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toHaveProperty("error");
  });
});
