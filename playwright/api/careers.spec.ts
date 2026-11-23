import { expect, test } from "@playwright/test";
import {
  careersEndpoints,
  seedJobSlug,
} from "../../fixtures/endpoints/careersEndpoints";
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import {
  applicationFieldValues,
  jobDetailKeys,
  jobListItemKeys,
  minimalResumePdfContents,
  uniqueRemoteJobRequest,
} from "../../fixtures/models/careersModel";

test.describe("careers API", () => {
  test.beforeEach(async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "customer@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);
  });

  test("lists jobs and returns the seed job by slug", async ({ request }) => {
    const response = await request.get(careersEndpoints.jobs);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["jobs"]);
    expect(body.jobs.length).toBeGreaterThan(0);
    expect(Object.keys(body.jobs[0]).sort()).toEqual([...jobListItemKeys].sort());
    expect(body.jobs.some((row: { slug: string }) => row.slug === seedJobSlug)).toBe(true);

    const detail = await request.get(careersEndpoints.job(seedJobSlug));
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    expect(Object.keys(detailBody).sort()).toEqual(["job"]);
    expect(Object.keys(detailBody.job).sort()).toEqual([...jobDetailKeys].sort());
    expect(detailBody.job.slug).toBe(seedJobSlug);
  });

  test("rejects jobs without a session", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const response = await anon.get(careersEndpoints.jobs);
    expect(response.status()).toBe(401);
    expect(await response.json()).toHaveProperty("error");
    await anon.dispose();
  });

  test("rejects job create for a non-admin", async ({ request }) => {
    const response = await request.post(careersEndpoints.jobs, {
      data: uniqueRemoteJobRequest(),
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Admin only." });
  });

  test("creates and deletes a job as admin", async ({ request }) => {
    const login = await request.post(loginEndpoints.login, {
      data: { email: "admin@marlow.test", password: "datalab" },
    });
    expect(login.status()).toBe(200);

    const payload = uniqueRemoteJobRequest();
    const create = await request.post(careersEndpoints.jobs, { data: payload });
    expect(create.status()).toBe(201);

    const created = await create.json();
    expect(Object.keys(created).sort()).toEqual(["job"]);
    expect(created.job.title).toBe(payload.title);
    expect(created.job.slug).toEqual(expect.any(String));
    expect(created.job.slug).not.toEqual("");

    const slug = created.job.slug as string;
    const del = await request.delete(careersEndpoints.job(slug));
    expect(del.status()).toBe(204);

    const missing = await request.get(careersEndpoints.job(slug));
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toHaveProperty("error");
  });

  test("submits an application and staff can list and download the resume", async ({
    request,
  }) => {
    const create = await request.post(careersEndpoints.applications(seedJobSlug), {
      multipart: {
        ...applicationFieldValues,
        resume: {
          name: "resume.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from(minimalResumePdfContents, "utf8"),
        },
      },
    });
    expect(create.status()).toBe(201);

    const created = await create.json();
    expect(Object.keys(created).sort()).toEqual(["application"]);
    expect(created.application.id).toEqual(expect.any(String));
    expect(created.application.id).not.toEqual("");
    const applicationId = created.application.id as string;

    const staffLogin = await request.post(loginEndpoints.login, {
      data: { email: "staff@marlow.test", password: "datalab" },
    });
    expect(staffLogin.status()).toBe(200);

    const list = await request.get(careersEndpoints.applicationsList);
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(Object.keys(listBody).sort()).toEqual(["applications"]);
    expect(listBody.applications.length).toBeGreaterThan(0);
    const found = (
      listBody.applications as { id: string; email: string }[]
    ).find((row) => row.id === applicationId);
    expect(found).toBeTruthy();
    expect(found!.email).toBe(applicationFieldValues.email);

    const resume = await request.get(careersEndpoints.resume(applicationId));
    expect(resume.status()).toBe(200);
    const bytes = await resume.body();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  test("rejects applications list for a customer", async ({ request }) => {
    const response = await request.get(careersEndpoints.applicationsList);
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Staff only." });
  });
});
