import { screen } from "@testing-library/react";
import { Checkout } from "./Checkout";
import { whenApi } from "./test/mockApi";
import { renderPage } from "./test/render";

jest.mock("./api", () => ({ api: jest.fn() }));

test("starts on shipping with the default address", async () => {
  whenApi();
  await renderPage(<Checkout />);

  expect(screen.getByTestId("checkout-title")).toHaveTextContent("Checkout");
  expect(screen.getByTestId("checkout-ship")).toBeChecked();
  expect(screen.getByTestId("checkout-name")).toHaveValue("Mina Adler");
  expect(screen.getByTestId("checkout-city")).toHaveValue("Austin");
});
