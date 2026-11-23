import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:5173",
    specPattern: ["cypress/tests/e2e/**/*.cy.ts", "cypress/tests/api/**/*.ts"],
    supportFile: false,
    video: false,
  },
});
