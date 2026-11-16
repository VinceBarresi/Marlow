import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const babel = {
  babelrc: false,
  configFile: false,
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [`${root}jest/import-meta.cjs`],
};

export default {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/web/src/**/*.test.tsx", "<rootDir>/frontends/**/*.test.tsx"],
  setupFiles: ["<rootDir>/jest/polyfill.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest/setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["babel-jest", babel],
  },
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react/index.js",
    "^react/jsx-runtime$": "<rootDir>/node_modules/react/jsx-runtime.js",
    "^react/jsx-dev-runtime$": "<rootDir>/node_modules/react/jsx-dev-runtime.js",
    "^react-dom$": "<rootDir>/node_modules/react-dom/index.js",
    "^react-dom/client$": "<rootDir>/node_modules/react-dom/client.js",
    "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
  },
};
