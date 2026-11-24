import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/@mf-types/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/blob-report/**",
      "**/cypress/videos/**",
      "**/cypress/screenshots/**",
      "**/cypress/downloads/**",
      "**/.appium/**",
      "**/ios/Marlow/build/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
    },
    settings: { react: { version: "detect" } },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "jest/setup.ts"],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["appium/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        $: "readonly",
        $$: "readonly",
        browser: "readonly",
        driver: "readonly",
        expect: "readonly",
      },
    },
  },
  prettier,
);
