# Marlow Postman

Import:

- `Marlow.API.postman_collection.json`
- `Marlow.local.postman_environment.json`

Default `baseUrl` is `http://127.0.0.1:4000` (API directly). Use `http://localhost:5173` if you want the Vite shop proxy and the same cookie origin as browser tests.

Run with the app up (`npm run dev`). Seed password is `datalab`.

Folder order matters for cookie session: login first, then catalog/cart/orders. Collection tests assert status codes and JSON Schema shapes aligned with `server/openapi.json` / `fixtures/schemas`.
