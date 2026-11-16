import { api } from "../api";

// Keys are API paths. A path matches the key, the key plus a query string, or the key plus /id.
export function whenApi(responses: Record<string, unknown> = {}) {
  (api as jest.Mock).mockImplementation((path: string) => {
    const key = Object.keys(responses)
      .sort((left, right) => right.length - left.length)
      .find((item) => path === item || path.startsWith(`${item}?`) || path.startsWith(`${item}/`));
    if (!key) return Promise.reject(new Error(`No mock for ${path}`));
    return Promise.resolve(responses[key]);
  });
}
