import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Login } from "./Login";

jest.mock("../api", () => ({ api: jest.fn() }));

test("shows the sign-in form", async () => {
  whenApi();
  await renderPage(<Login />);

  expect(screen.getByTestId("login-title")).toHaveTextContent("Marlow");
  expect(screen.getByTestId("login-email")).toHaveValue("customer@marlow.test");
  expect(screen.getByTestId("login-submit")).toHaveTextContent("Sign in");
});
