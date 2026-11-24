import { expect, test } from "@playwright/test";
import { customersEndpoints } from "../../fixtures/endpoints/customersEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import {
  customerDetailKeys,
  customerListItemKeys,
  customerOrderKeys,
} from "../../fixtures/models/customersModel";
import { customerListSchema, errorSchema } from "../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../fixtures/schemas/assertSchema";

test.describe("customers API", () => {
  test("rejects customers for a customer role", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(customersEndpoints.customers);
    expect(response.status()).toBe(403);
    const forbidden = await response.json();
    assertSchema(errorSchema, forbidden, "customers forbidden");
    expect(forbidden).toEqual({ error: "Staff only." });
  });

  test("rejects customers without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(customersEndpoints.customers);
    expect(response.status()).toBe(401);
    assertSchema(errorSchema, await response.json(), "customers unauthorized");
    await anon.dispose();
  });

  test("lists customers and returns a customer by id for staff", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "staff@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const response = await request.get(customersEndpoints.customers);
    expect(response.status()).toBe(200);

    const body = assertSchema(customerListSchema, await response.json(), "customers");
    expect(body.customers.length).toBeGreaterThan(0);

    const customer =
      body.customers.find((row) => row.email === "customer@marlow.test") ?? body.customers[0];
    expect(Object.keys(customer).sort()).toEqual([...customerListItemKeys].sort());
    expect(customer.id).toEqual(expect.any(String));
    expect(customer.id).not.toEqual("");

    const detail = await request.get(customersEndpoints.customer(customer.id));
    expect(detail.status()).toBe(200);

    const detailBody = await detail.json();
    expect(Object.keys(detailBody).sort()).toEqual(["customer", "orders"]);
    expect(Object.keys(detailBody.customer).sort()).toEqual([...customerDetailKeys].sort());
    expect(detailBody.customer.id).toBe(customer.id);
    expect(Array.isArray(detailBody.orders)).toBe(true);
    if (detailBody.orders.length > 0) {
      expect(Object.keys(detailBody.orders[0]).sort()).toEqual([...customerOrderKeys].sort());
    }
  });
});
