import { defineConfig, devices } from "@playwright/test";

const useBlobReporter = Boolean(process.env.PLAYWRIGHT_DOCKER || process.env.CI);

export default defineConfig({
  testDir: "playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results",
  reporter: useBlobReporter ? [["blob"], ["line"]] : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "api", testMatch: "**/api/**/*.spec.ts" },
    {
      name: "chromium",
      testIgnore: "**/api/**",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: "**/api/**",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testIgnore: "**/api/**",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
