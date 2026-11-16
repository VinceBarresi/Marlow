# data-lab

Local retail shop for practicing Cypress and Playwright. The shop is called Marlow. Postgres and Redis run in Docker. The shop shell and the product and order screens are separate frontends. The API, catalog, orders, and database console are separate services.

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

3. Load the catalog, customers, and orders. This replaces the current shop data.

   ```bash
   node server/scripts/seed.mjs | docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -q
   ```

   If the database was already seeded before the admin account existed, add that account without reloading the shop:

   ```bash
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/003_admin.sql
   ```

4. Install and start each app in its own terminal.

   ```bash
   npm install
   npm run dev
   ```

   Run that in `server`, `services/catalog`, `services/orders`, `services/db`, `web`, `frontends/catalog`, and `frontends/orders`.

   If `npm install` stops on the esbuild postinstall script, approve it and install again:

   ```bash
   npm install-scripts approve esbuild
   npm install
   ```

5. Open the shop at [http://localhost:5173](http://localhost:5173). Use `localhost`, not `127.0.0.1`.

## Processes

| Directory           | What it serves                                                                                    | URL                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `server`            | Sign-in, inventory, pick, ship, and tracking. Forwards catalog and order calls to those services. | [http://127.0.0.1:4000](http://127.0.0.1:4000) |
| `services/catalog`  | Products and categories                                                                           | [http://127.0.0.1:4001](http://127.0.0.1:4001) |
| `services/orders`   | Cart, checkout, order history, and cancel                                                         | [http://127.0.0.1:4002](http://127.0.0.1:4002) |
| `services/db`       | Database console                                                                                  | [http://127.0.0.1:4003](http://127.0.0.1:4003) |
| `web`               | Shop shell                                                                                        | [http://localhost:5173](http://localhost:5173) |
| `frontends/catalog` | Product grid and product page, loaded by the shell                                                | [http://localhost:5174](http://localhost:5174) |
| `frontends/orders`  | Cart, checkout, and order pages, loaded by the shell                                              | [http://localhost:5175](http://localhost:5175) |

API docs are at [http://127.0.0.1:4000/docs](http://127.0.0.1:4000/docs). The shop proxies `/api` to the main API, so the session cookie stays on the shop origin.

## Logins

| Role     | Email                | Password |
| -------- | -------------------- | -------- |
| Customer | customer@marlow.test | datalab  |
| Staff    | staff@marlow.test    | datalab  |
| Admin    | admin@marlow.test    | datalab  |

The customer is Mina Adler. The staff user is Jordan Walsh. The admin is Avery Chen.

A customer sees only their own orders. Staff can see every order, pick, ship, and update tracking.

On the database console, staff can run read-only queries. The admin can also insert, update, and delete. Customers can sign in, but cannot query. Schema changes such as `DROP` and `ALTER` are refused for every role.

## Tests

```bash
npm test
```

Run that in `server` and in `web`.

## Lint and format

From this directory:

```bash
npm run lint
npm run format
```
