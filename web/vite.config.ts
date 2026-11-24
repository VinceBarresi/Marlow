import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const publicHost = process.env.E2E_HOST ?? "localhost";
const listenHost = process.env.LISTEN_HOST ?? "127.0.0.1";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "storefront",
      remotes: {
        catalog: {
          type: "module",
          name: "catalog",
          entry: `http://${publicHost}:5174/remoteEntry.js`,
        },
        orders: {
          type: "module",
          name: "orders",
          entry: `http://${publicHost}:5175/remoteEntry.js`,
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
    host: listenHost,
    port: 5173,
    strictPort: true,
    // Docker e2e hits the shop as host.docker.internal (Vite blocks unknown hosts by default).
    allowedHosts: true,
    origin: `http://${publicHost}:5173`,
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  build: {
    target: "chrome89",
  },
});
