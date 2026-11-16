# Shop shell

The Marlow shop at [http://localhost:5173](http://localhost:5173). Sign-in, locations, careers, account, and the staff and admin screens live here. Product and order screens are loaded from the other frontends.

Start Postgres, Redis, and the other apps as described in the root README. Then, from this directory:

```bash
npm install
npm run dev
```

Open the shop on `localhost`, not `127.0.0.1`. The session cookie is tied to that origin.

## Tools

- **Vite** serves the app in development and builds it for production. `npm run dev` runs `vite`. The dev server proxies `/api` to the API on port 4000.
- **@vitejs/plugin-react** compiles JSX and refreshes the page while you edit.
- **@module-federation/vite** loads the catalog remote from port 5174 and the orders remote from port 5175. React and React Router are shared singletons, so the shell and the remotes use one copy of each.
- **React** and **React Router** render the shell and its routes.
- **TypeScript** checks the source. Vite transforms it with esbuild.
- **tsx** runs the money-formatting tests through Node's test runner: `npm test` in this directory.
- **Jest** runs the page tests from the repo root: `npm test`. A sample sits next to each page.

Store maps use the Google Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`. Copy `.env.example`. Without a key, the locations list uses Leaflet with OpenStreetMap tiles, loaded in the browser, and a store page embeds a Google map.
