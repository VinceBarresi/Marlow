import { fireEvent, screen, waitFor } from "@testing-library/react";
import { api } from "../api";
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

test("shows an error when sign-in fails", async () => {
  whenApi();
  (api as jest.Mock).mockImplementation(() =>
    Promise.reject(new Error("Email or password is wrong.")),
  );
  await renderPage(<Login />);

  fireEvent.submit(screen.getByTestId("login-form"));

  await waitFor(() => {
    expect(screen.getByTestId("login-error")).toHaveTextContent("Email or password is wrong.");
  });
  expect(screen.getByTestId("login-page")).toBeInTheDocument();
});
