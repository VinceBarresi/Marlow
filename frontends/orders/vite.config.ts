import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const publicHost = process.env.E2E_HOST ?? "localhost";
const listenHost = process.env.LISTEN_HOST ?? "127.0.0.1";

export default defineConfig({
  base: `http://${publicHost}:5175`,
  plugins: [
    react(),
    federation({
      name: "orders",
      filename: "remoteEntry.js",
      exposes: {
        "./Cart": "./src/Cart.tsx",
        "./Checkout": "./src/Checkout.tsx",
        "./Orders": "./src/Orders.tsx",
        "./Order": "./src/Order.tsx",
        "./Receipt": "./src/Receipt.tsx",
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
    port: 5175,
    origin: `http://${publicHost}:5175`,
    strictPort: true,
    // Docker e2e hits remotes as host.docker.internal (Vite blocks unknown hosts by default).
    allowedHosts: true,
    cors: true,
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  build: {
    target: "chrome89",
  },
});
