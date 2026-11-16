import { federation } from "@module-federation/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "http://localhost:5175",
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
    port: 5175,
    origin: "http://localhost:5175",
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
