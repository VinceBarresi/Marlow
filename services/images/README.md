# Images service

Product image storage for Marlow. Listens on [http://127.0.0.1:4006](http://127.0.0.1:4006).

Auth for uploads is **OAuth2 client credentials + Bearer**. Public `GET /v1/objects/:id` serves bytes with no auth. The API on port 4000 is the OAuth client and proxies staff uploads plus same-origin `/api/images/:id` for the shop.

Files live on disk under `services/images/data/objects/<aa>/<id>.<ext>` (gitignored). Metadata is in Postgres `product_images`.

Catalog photos (real JPEGs) live in repo [`fixtures/images/`](../../fixtures/images/). `npm run seed-placeholders` fills missing SVGs, then replaces **BED-10331** (Black Analog Alarm Clock) with `black-analog-alarm-clock.jpg`.

```bash
npm install
npm run seed-placeholders   # placeholders + known catalog photos
npm run dev
```

## Auth

| Endpoint                                     | Auth                            |
| -------------------------------------------- | ------------------------------- |
| `POST /oauth/token`                          | `client_id` + `client_secret`   |
| `POST /v1/objects`, `DELETE /v1/objects/:id` | Service Bearer (`scope=images`) |
| `GET /v1/objects/:id`, `GET /v1/skus/:sku`   | Public                          |

Defaults:

- `IMAGES_CLIENT_ID=marlow-api`
- `IMAGES_CLIENT_SECRET=marlow-images-dev-secret`
- `IMAGES_TOKEN_SECRET=marlow-images-token-dev`
- `IMAGES_DATA_DIR` → `./data`

## Tools

- **Fastify** + **@fastify/multipart**
- **node-postgres** for `product_images`
- Deterministic SVG placeholders from SKU hash
