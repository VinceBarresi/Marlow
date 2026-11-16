import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "http://localhost:5174",
  plugins: [
    react(),
    federation({
      name: "catalog",
      filename: "remoteEntry.js",
      exposes: {
        "./Shop": "./src/Shop.tsx",
        "./Product": "./src/Product.tsx",
        "./Category": "./src/Category.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.0" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.9.6" },
      },
    }),
  ],
  server: {
    port: 5174,
    origin: "http://localhost:5174",
    strictPort: true,
    cors: true,
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  build: {
    target: "chrome89",
  },
});
