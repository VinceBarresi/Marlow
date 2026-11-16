# Orders frontend

Cart, checkout, order list, order detail, and the receipt page. The shop shell loads these screens from [http://localhost:5175](http://localhost:5175). This app can also be opened on its own.

From this directory:

```bash
npm install
npm run dev
```

## Tools

- **Vite** serves the app and builds it. `npm run dev` runs `vite`. The dev server proxies `/api` to the API on port 4000 and allows the shell on port 5173 to load this origin.
- **@vitejs/plugin-react** compiles JSX and refreshes the page while you edit.
- **@module-federation/vite** publishes `remoteEntry.js` and exposes `Cart`, `Checkout`, `Orders`, `Order`, and `Receipt`. React and React Router are shared singletons with the shell.
- **React** and **React Router** render the order screens.
- **TypeScript** checks the source. Vite transforms it with esbuild.
