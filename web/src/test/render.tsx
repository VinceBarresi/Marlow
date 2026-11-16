import { act, render, type RenderResult } from "@testing-library/react";
import { type ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth";

// Renders one page on a route. Call whenApi() first so /api/me and the page's requests resolve.
export async function renderPage(
  ui: ReactElement,
  path = "/",
  pattern = "*",
): Promise<RenderResult> {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={pattern} element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return view;
}
