# Payments service

Stripe-style sandbox for Marlow. Listens on [http://127.0.0.1:4005](http://127.0.0.1:4005).

Auth is **OAuth2 client credentials + Bearer tokens** (not Marlow session cookies). The API on port 4000 is the OAuth client and proxies payment-method and checkout flows. Raw card numbers and CVCs are accepted only here; Marlow stores `pm_…` / `pi_…` ids and display fields (`brand`, `last4`).

Postgres must already be running (tables from `server/sql/006_payments.sql`). From this directory:

```bash
npm install
npm run dev
```

## Auth

| Endpoint | Auth |
| -------- | ---- |
| `POST /oauth/token` | `client_id` + `client_secret` (`grant_type=client_credentials`) |
| `POST/GET/DELETE /v1/payment-methods` | Service Bearer (`scope=payments`) |
| `POST/GET /v1/payment-intents` | Service Bearer |

Default local credentials (override with env):

- `PAYMENTS_CLIENT_ID=marlow-api`
- `PAYMENTS_CLIENT_SECRET=marlow-payments-dev-secret`
- `PAYMENTS_TOKEN_SECRET=marlow-payments-token-dev`

## Test cards

| Number | Result |
| ------ | ------ |
| `4242424242424242` | Succeeds |
| `4000000000000002` | `card_declined` |
| `4000000000009995` | `insufficient_funds` |

CVC is required on create but never stored. Only a sandbox `test_card_key` is kept so later charges work without the PAN.

## Tools

- **Fastify** HTTP server
- **node-postgres** for `payment_methods` / `payment_intents`
- **MockStripeClient** Luhn + Stripe-shaped test PAN behavior
