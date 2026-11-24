# Marlow

Local retail shop for practicing test automation across the stack. Postgres and Redis run in Docker. The shop shell and the product and order screens are separate frontends (Vite + Module Federation). The API, catalog, orders, shipping, payments, and database console are separate Fastify services. There is also a native SwiftUI iOS app.

**Test layers**

| Layer          | Tools                  | What it covers                                                                    |
| -------------- | ---------------------- | --------------------------------------------------------------------------------- |
| Mock component | Jest + Testing Library | Page/components with a mocked API (`*.test.tsx`); also server/web unit tests      |
| API            | Cypress + Playwright   | HTTP status/body against the live gateway (`cypress/tests/api`, `playwright/api`) |
| Browser e2e    | Cypress + Playwright   | Live flows under `e2e/`                                                           |
| Mock UI        | Cypress + Playwright   | Browser UI with mocked API under `e2e/mock-ui/` (`cy.intercept` / `page.route`)   |
| iOS e2e        | Appium + WebDriverIO   | Simulator flows for `ios/Marlow` (`appium/`)                                      |

Cypress and Playwright mirror each other for API and e2e so you can compare frameworks on the same product.

## Run it

From this directory:

```bash
npm run dev
```

That starts Postgres, Redis, and all seven apps. The first time the database has no tables, it creates them and loads the shop. Later runs leave the data in place. Ctrl+C stops the apps and leaves Postgres and Redis running.

Open the shop at [http://localhost:5173](http://localhost:5173). Use `localhost`, not `127.0.0.1`.

Store maps use the Google Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is set in `web/.env`. Copy `web/.env.example`. Without a key, the list still shows every store on one map and each store page embeds a Google map.

### One piece at a time

1. Start Postgres and Redis.

   ```bash
   docker compose up -d
   ```

2. Create the tables.

   ```bash
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/001_schema.sql
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/002_tracking.sql
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/004_locations.sql
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/005_careers.sql
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/006_payments.sql
   ```

   | Migration           | Adds                                                                        |
   | ------------------- | --------------------------------------------------------------------------- |
   | `001_schema.sql`    | Core shop: `users`, `products`, `inventory`, `orders`, lines/events, etc.   |
   | `002_tracking.sql`  | Shipping: `shipments`, `tracking_events`                                    |
   | `004_locations.sql` | Stores: `locations`, `location_inventory`                                   |
   | `005_careers.sql`   | Hiring: `jobs`, `applications`                                              |
   | `006_payments.sql`  | Payments: `payment_methods`, `payment_intents`; payment columns on `orders` |

3. Load the catalog, customers, and orders. This replaces the current shop data.

   ```bash
   node server/scripts/seed.mjs | docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -q
   ```

   If the database was already seeded before the admin account existed, add that account without reloading the shop:

   ```bash
   docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < server/sql/003_admin.sql
   ```

4. Install and start each app in its own terminal. Run these commands in that directory, not in the repo root.

   ```bash
   npm install
   npm run dev
   ```

   The directories are `server`, `services/catalog`, `services/orders`, `services/shipping`, `services/payments`, `services/db`, `web`, `frontends/catalog`, and `frontends/orders`.

   If `npm install` stops on the esbuild postinstall script, approve it and install again:

   ```bash
   npm install-scripts approve esbuild
   npm install
   ```

## Processes

| Directory           | What it serves                                                                                    | URL                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `server`            | Sign-in, inventory, pick, ship, and tracking. Forwards catalog and order calls to those services. | [http://127.0.0.1:4000](http://127.0.0.1:4000) |
| `services/catalog`  | Products and categories                                                                           | [http://127.0.0.1:4001](http://127.0.0.1:4001) |
| `services/orders`   | Cart, checkout, order history, and cancel                                                         | [http://127.0.0.1:4002](http://127.0.0.1:4002) |
| `services/shipping` | Carrier shipments and tracking (OAuth2 Bearer; mock FedEx-shaped)                                 | [http://127.0.0.1:4004](http://127.0.0.1:4004) |
| `services/payments` | Stripe-style PaymentMethods / PaymentIntents (OAuth2 Bearer; sandbox test cards)                  | [http://127.0.0.1:4005](http://127.0.0.1:4005) |
| `services/db`       | Database console                                                                                  | [http://127.0.0.1:4003](http://127.0.0.1:4003) |
| `web`               | Shop shell                                                                                        | [http://localhost:5173](http://localhost:5173) |
| `frontends/catalog` | Product grid and product page, loaded by the shell                                                | [http://localhost:5174](http://localhost:5174) |
| `frontends/orders`  | Cart, checkout, and order pages, loaded by the shell                                              | [http://localhost:5175](http://localhost:5175) |

API docs are at [http://127.0.0.1:4000/docs](http://127.0.0.1:4000/docs). The shop proxies `/api` to the main API, so the session cookie stays on the shop origin.

Shipping is a separate service with **Bearer** auth (`POST /oauth/token`). The gateway uses a service token for staff ship/track, and web/iOS can mint a user tracking token via `POST /api/shipping/access-token` then call `GET /api/tracking/:trackingNumber` with `Authorization: Bearer …`. See [`services/shipping/README.md`](services/shipping/README.md).

Payments is the same pattern on `:4005`: the API mints a service Bearer token and proxies `/api/payment-methods` plus card-charged `/api/checkout`. PAN/CVC never leave the payments service; Marlow stores `pm_…` / `pi_…` ids and last4/brand. See [`services/payments/README.md`](services/payments/README.md).

How the processes, screens, and data fit together is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Mobile

Native SwiftUI customer app lives in [`ios/Marlow`](ios/Marlow). Open `ios/Marlow/Marlow.xcodeproj` in Xcode, start the API with `npm run dev`, and run on the Simulator (API at `http://127.0.0.1:4000`). See [ios/Marlow/README.md](ios/Marlow/README.md) and [ios/Marlow/ARCHITECTURE.md](ios/Marlow/ARCHITECTURE.md).

Appium + WebDriverIO Simulator tests live in [`appium/`](appium/). With the API up and Xcode installed:

```bash
npm run appium:ios
```

## Tools

Each app has its own README with the libraries it uses. These are shared:

| Tool              | Where                  | Role                                                                        |
| ----------------- | ---------------------- | --------------------------------------------------------------------------- |
| Docker Compose    | this directory         | Runs Postgres 16 and Redis 7                                                |
| Vite              | `web`, `frontends/*`   | Dev server and production build                                             |
| Module Federation | `web`, `frontends/*`   | The shell loads the catalog and orders screens at runtime                   |
| React             | `web`, `frontends/*`   | UI                                                                          |
| React Router      | `web`, `frontends/*`   | Routes in the shell and in the loaded screens                               |
| Fastify           | `server`, `services/*` | HTTP                                                                        |
| tsx               | `server`, `services/*` | Runs TypeScript and restarts the process when a file changes                |
| node-postgres     | `server`, `services/*` | Postgres client (`pg`)                                                      |
| ioredis           | `server`, `services/*` | Redis client                                                                |
| TypeScript        | every app              | Types. Vite and tsx both transform it with esbuild                          |
| ESLint            | this directory         | Lint, including React and TypeScript rules                                  |
| Prettier          | this directory         | Format                                                                      |
| Jest              | this directory         | Unit tests for each page. `npm test` renders the page with a mocked API     |
| Cypress           | this directory         | API tests in `cypress/tests/api` and browser tests in `cypress/tests/e2e`   |
| Playwright        | this directory         | API + browser tests in `playwright/`. Local: `playwright` / `playwright:ui` |
| Appium / WDIO     | `appium/`              | iOS Simulator UI tests for `ios/Marlow`. Local: `appium:ios`                |

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

**Jest (mock component)** — `npm run test:unit` runs every unit test: Jest page tests, then pricing and query tests in `server`, then the money formatting test in `web`. Each page has a sample next to it (for example `web/src/pages/Login.test.tsx`). The sample mocks `api`, renders the page, and checks a test id. Browser network stubs are **mock UI** (`cy.intercept` / `page.route` under `e2e/mock-ui/`), not Jest. Copy that sample when you add a case.

**Cypress** — `npm run cypress:api` / `npm run cypress:e2e`, or `npm run cypress` to open the runner. Specs live under `cypress/tests/`.

**Playwright** — `npm run playwright` / `npm run playwright:api` / `npm run playwright:ui`. Specs live under `playwright/`.

**Appium + WDIO** — with the API up and Xcode installed, `npm run appium:ios` runs Simulator UI tests from `appium/`. See [appium/README.md](appium/README.md).

A push to GitHub runs unit tests, Prettier, ESLint, Cypress, and Playwright. The Cypress and Playwright checks start the shop, then run tests in Docker workers (Cypress splits API vs e2e specs; Playwright uses `--shard` — no Cypress Cloud).

Locally, with Docker available:

```bash
npm run cypress:docker
npm run playwright:docker
```

Each script starts the shop via `scripts/e2e-up.sh` if needed, then runs parallel containers against `host.docker.internal:5173`.

## Lint and format

From this directory:

```bash
npm run lint
npm run format
```
