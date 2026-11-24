import { careersEndpoints, seedJobSlug } from "../../../fixtures/endpoints/careersEndpoints";
import { loginEndpoints } from "../../../fixtures/endpoints/loginEndpoints";
import {
  applicationFieldValues,
  jobDetailKeys,
  jobListItemKeys,
  minimalResumePdfContents,
  uniqueRemoteJobRequest,
} from "../../../fixtures/models/careersModel";
import { errorSchema, jobListSchema } from "../../../fixtures/schemas/apiSchemas";
import { assertSchema } from "../../../fixtures/schemas/assertSchema";

describe("careers API", () => {
  beforeEach(() => {
    cy.request("POST", loginEndpoints.login, {
      email: "customer@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);
  });

  it("lists jobs and returns the seed job by slug", () => {
    cy.request("GET", careersEndpoints.jobs).then((response) => {
      expect(response.status).to.eq(200);
      const list = assertSchema(jobListSchema, response.body, "jobs");
      expect(list.jobs).to.not.have.length(0);
      expect(response.body.jobs[0]).to.have.all.keys(...jobListItemKeys);

      const seed = list.jobs.find((row) => row.slug === seedJobSlug);
      expect(seed, "seed software-engineer").to.not.equal(undefined);
    });

    cy.request("GET", careersEndpoints.job(seedJobSlug)).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.all.keys("job");
      expect(response.body.job).to.have.all.keys(...jobDetailKeys);
      expect(response.body.job.slug).to.eq(seedJobSlug);
    });
  });

  it("rejects jobs without a session", () => {
    cy.clearCookies();
    cy.request({
      method: "GET",
      url: careersEndpoints.jobs,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      assertSchema(errorSchema, response.body, "jobs unauthorized");
    });
  });

  it("rejects job create for a non-admin", () => {
    cy.request({
      method: "POST",
      url: careersEndpoints.jobs,
      body: uniqueRemoteJobRequest(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body).to.deep.equal({ error: "Admin only." });
    });
  });

  it("creates and deletes a job as admin", () => {
    cy.request("POST", loginEndpoints.login, {
      email: "admin@marlow.test",
      password: "datalab",
    })
      .its("status")
      .should("eq", 200);

    const payload = uniqueRemoteJobRequest();
    cy.request("POST", careersEndpoints.jobs, payload).then((create) => {
      expect(create.status).to.eq(201);
      expect(create.body).to.have.all.keys("job");
      expect(create.body.job.title).to.eq(payload.title);
      expect(create.body.job.slug).to.be.a("string").and.not.equal("");

      const slug = create.body.job.slug as string;
      cy.request({ method: "DELETE", url: careersEndpoints.job(slug) }).then((del) => {
        expect(del.status).to.eq(204);
      });

      cy.request({
        method: "GET",
        url: careersEndpoints.job(slug),
        failOnStatusCode: false,
      }).then((missing) => {
        expect(missing.status).to.eq(404);
        expect(missing.body).to.have.property("error");
      });
    });
  });

  it("submits an application and staff can list and download the resume", () => {
    cy.window()
      .then(async (win) => {
        const formData = new FormData();
        for (const [key, value] of Object.entries(applicationFieldValues)) {
          formData.append(key, value);
        }
        formData.append(
          "resume",
          new Blob([minimalResumePdfContents], { type: "application/pdf" }),
          "resume.pdf",
        );

        const createResponse = await win.fetch(careersEndpoints.applications(seedJobSlug), {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        expect(createResponse.status).to.eq(201);
        const createBody = (await createResponse.json()) as { application: { id: string } };
        expect(createBody).to.have.all.keys("application");
        expect(createBody.application.id).to.be.a("string").and.not.equal("");
        return createBody.application.id;
      })
      .then((applicationId) => {
        cy.request("POST", loginEndpoints.login, {
          email: "staff@marlow.test",
          password: "datalab",
        })
          .its("status")
          .should("eq", 200);

        cy.request("GET", careersEndpoints.applicationsList).then((list) => {
          expect(list.status).to.eq(200);
          expect(list.body).to.have.all.keys("applications");
          expect(list.body.applications).to.be.an("array").and.not.have.length(0);
          const found = (list.body.applications as { id: string; email: string }[]).find(
            (row) => row.id === applicationId,
          );
          expect(found, "submitted application").to.not.equal(undefined);
          expect(found!.email).to.eq(applicationFieldValues.email);
        });

        cy.request({
          method: "GET",
          url: careersEndpoints.resume(applicationId),
          encoding: "binary",
        }).then((resume) => {
          expect(resume.status).to.eq(200);
          expect(resume.body).to.be.a("string").and.not.equal("");
        });
      });
  });

  it("rejects applications list for a customer", () => {
    cy.request({
      method: "GET",
      url: careersEndpoints.applicationsList,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body).to.deep.equal({ error: "Staff only." });
    });
  });
});
