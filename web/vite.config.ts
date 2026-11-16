import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "storefront",
      remotes: {
        catalog: {
          type: "module",
          name: "catalog",
          entry: "http://localhost:5174/remoteEntry.js",
        },
        orders: {
          type: "module",
          name: "orders",
          entry: "http://localhost:5175/remoteEntry.js",
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.0" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.9.6" },
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    origin: "http://localhost:5173",
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  build: {
    target: "chrome89",
  },
});
