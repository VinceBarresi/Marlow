# Catalog frontend

Product grid, category page, and product page. The shop shell loads these screens from [http://localhost:5174](http://localhost:5174). This app can also be opened on its own.

From this directory:

```bash
npm install
npm run dev
```

## Tools

- **Vite** serves the app and builds it. `npm run dev` runs `vite`. The dev server proxies `/api` to the API on port 4000 and allows the shell on port 5173 to load this origin.
- **@vitejs/plugin-react** compiles JSX and refreshes the page while you edit.
- **@module-federation/vite** publishes `remoteEntry.js` and exposes `Shop`, `Product`, and `Category`. React and React Router are shared singletons with the shell.
- **React** and **React Router** render the catalog screens.
- **TypeScript** checks the source. Vite transforms it with esbuild.
