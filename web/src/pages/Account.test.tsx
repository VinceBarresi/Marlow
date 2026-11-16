import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Account } from "./Account";

jest.mock("../api", () => ({ api: jest.fn() }));

const mina = {
  id: "user-1",
  email: "customer@marlow.test",
  name: "Mina Adler",
  role: "customer" as const,
};

test("shows the signed-in person", async () => {
  whenApi({ "/api/me": { user: mina } });
  await renderPage(<Account />);

  expect(screen.getByTestId("account-name")).toHaveTextContent("Mina Adler");
  expect(screen.getByTestId("account-email")).toHaveTextContent("customer@marlow.test");
  expect(screen.getByTestId("account-role")).toHaveTextContent("customer");
});
