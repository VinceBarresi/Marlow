# Shipping service

Third-party-style carrier service for Marlow. Listens on [http://127.0.0.1:4004](http://127.0.0.1:4004).

Auth is **OAuth2 client credentials + Bearer tokens** (not Marlow session cookies). The API on port 4000 is the OAuth client and proxies staff ship/track flows. Web and iOS can mint a short-lived user tracking token through the gateway.

Postgres must already be running. From this directory:

```bash
npm install
npm run dev
```

## Auth

| Endpoint                         | Auth                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| `POST /oauth/token`              | `client_id` + `client_secret` (`grant_type=client_credentials`) |
| `POST /oauth/user-token`         | Service Bearer (`scope=shipping`)                               |
| `POST /shipments`, events, patch | Service Bearer                                                  |
| `GET /track/:trackingNumber`     | Service Bearer **or** user Bearer (`scope=tracking:read`)       |

Default local credentials (override with env):

- `SHIPPING_CLIENT_ID=marlow-api`
- `SHIPPING_CLIENT_SECRET=marlow-shipping-dev-secret`
- `SHIPPING_TOKEN_SECRET=marlow-shipping-token-dev`

## Tools

- **Fastify** HTTP server
- **node-postgres** for `shipments` / `tracking_events`
- **MockFedExClient** issues FedEx-shaped tracking numbers without external keys
