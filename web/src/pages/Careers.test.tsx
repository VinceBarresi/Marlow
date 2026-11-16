import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Careers } from "./Careers";

jest.mock("../api", () => ({ api: jest.fn() }));

test("lists an open role", async () => {
  whenApi({
    "/api/locations": { locations: [] },
    "/api/jobs": {
      jobs: [
        {
          slug: "software-engineer",
          title: "Software Engineer",
          department: "engineering",
          workplace: "remote",
          summary: "Build the shop.",
          location: null,
        },
      ],
    },
  });
  await renderPage(<Careers />);

  expect(screen.getByTestId("careers-title")).toHaveTextContent("Careers");
  expect(screen.getByTestId("job-card-software-engineer")).toHaveTextContent("Software Engineer");
  expect(screen.getByTestId("job-card-software-engineer")).toHaveTextContent("Remote");
});
