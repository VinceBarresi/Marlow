# data-lab

Local retail shop for practicing Cypress and Playwright. The shop is called Marlow. The API is a Fastify server, the site is a Vite React app, and Postgres and Redis run in Docker.

## Run it

From this directory:

1. Start Postgres and Redis.

   ```bash
   docker compose up -d
   ```

2. Create the tables.

   ```bash
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/001_schema.sql
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/002_tracking.sql
   ```

3. Load the catalog, customers, and orders.

   ```bash
   node server/scripts/seed.mjs | docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -q
   ```

4. Install and start the API and the site in two terminals.

   ```bash
   npm install
   npm run dev
   ```

   Run that in both `server` and `web`. If `npm install` stops on the esbuild postinstall script, approve it and install again:

   ```bash
   npm install-scripts approve esbuild
   npm install
   ```

5. Open the shop at [http://localhost:5173](http://localhost:5173). Use `localhost`, not `127.0.0.1`.

The API listens on [http://127.0.0.1:4000](http://127.0.0.1:4000). API docs are at [http://127.0.0.1:4000/docs](http://127.0.0.1:4000/docs). The site proxies `/api` to the API, so the session cookie stays on the site origin.

## Logins

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@marlow.test | datalab |
| Staff | staff@marlow.test | datalab |

The customer is Mina Adler. The staff user is Jordan Walsh. Staff can see every order, pick, ship, and update tracking. A customer sees only their own orders.

## Tests

```bash
npm test
```

Run that in `server` and in `web`.
