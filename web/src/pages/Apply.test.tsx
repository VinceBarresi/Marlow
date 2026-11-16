import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Apply } from "./Apply";

jest.mock("../api", () => ({ api: jest.fn() }));

const job = {
  slug: "software-engineer",
  title: "Software Engineer",
  department: "engineering",
  workplace: "remote",
  summary: "Build the shop.",
  description: "TypeScript, React, and the catalog.",
  location: null,
};

test("shows the role and the application form", async () => {
  whenApi();
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ job }),
  }) as typeof fetch;
  await renderPage(<Apply />, "/careers/software-engineer", "/careers/:slug");

  expect(screen.getByTestId("apply-title")).toHaveTextContent("Software Engineer");
  expect(screen.getByTestId("apply-description")).toHaveTextContent("TypeScript, React");
  expect(screen.getByTestId("apply-submit")).toHaveTextContent("Submit application");
});
