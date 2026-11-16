import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Admin } from "./Admin";

jest.mock("../api", () => ({ api: jest.fn() }));

test("links to the database console and the store and role editors", async () => {
  whenApi({
    "/api/me": {
      user: {
        id: "user-3",
        email: "admin@marlow.test",
        name: "Avery Chen",
        role: "admin",
      },
    },
  });
  await renderPage(<Admin />);

  expect(screen.getByTestId("admin-name")).toHaveTextContent("admin@marlow.test");
  expect(screen.getByTestId("admin-console")).toHaveAttribute("href", "http://127.0.0.1:4003");
  expect(screen.getByTestId("admin-locations")).toHaveAttribute("href", "/locations");
  expect(screen.getByTestId("admin-jobs")).toHaveAttribute("href", "/careers");
});
