import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:5173",
    specPattern: ["cypress/tests/e2e/**/*.cy.ts", "cypress/tests/api/**/*.ts"],
    supportFile: false,
    video: false,
    setupNodeEvents(on) {
      on("task", {
        async postMultipartFile(input: {
          url: string;
          filePath: string;
          filename: string;
          cookie?: string;
        }) {
          const absolute = path.isAbsolute(input.filePath)
            ? input.filePath
            : path.join(process.cwd(), input.filePath);
          const buffer = readFileSync(absolute);
          const form = new FormData();
          form.set("file", new Blob([buffer], { type: "image/jpeg" }), input.filename);
          const headers: Record<string, string> = {};
          if (input.cookie) headers.cookie = input.cookie;
          const response = await fetch(input.url, {
            method: "POST",
            headers,
            body: form,
          });
          const text = await response.text();
          let body: unknown = text;
          try {
            body = text ? JSON.parse(text) : {};
          } catch {
            /* leave as text */
          }
          return { status: response.status, body };
        },
      });
    },
  },
});
