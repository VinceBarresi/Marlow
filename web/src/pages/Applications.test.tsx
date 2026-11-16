import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Applications } from "./Applications";

jest.mock("../api", () => ({ api: jest.fn() }));

test("lists an application and its resume", async () => {
  whenApi({
    "/api/applications": {
      applications: [
        {
          id: "app-1",
          name: "Mina Adler",
          email: "customer@marlow.test",
          phone: "512-555-0100",
          city: "Austin",
          createdAt: "2026-03-01T15:00:00.000Z",
          resumeName: "mina.pdf",
          job: {
            slug: "software-engineer",
            title: "Software Engineer",
            department: "engineering",
            workplace: "remote",
            city: null,
          },
        },
      ],
    },
  });
  await renderPage(<Applications />);

  expect(screen.getByTestId("application-app-1")).toHaveTextContent("Mina Adler");
  expect(screen.getByTestId("application-app-1")).toHaveTextContent("Software Engineer");
  expect(screen.getByTestId("resume-app-1")).toHaveAttribute(
    "href",
    "/api/applications/app-1/resume",
  );
});
