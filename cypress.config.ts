import { defineConfig } from "cypress";
import { allureCypress } from "allure-cypress/reporter";
import * as os from "node:os";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:5173",
    specPattern: ["cypress/tests/e2e/**/*.cy.ts", "cypress/tests/api/**/*.ts"],
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      allureCypress(on, config, {
        resultsDir: process.env.ALLURE_RESULTS_DIR ?? "allure-results",
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          node_version: process.version,
        },
      });
      return config;
    },
  },
});
