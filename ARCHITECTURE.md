# How Marlow is put together

The browser only talks to the shop on port 5173. Vite serves the pages and forwards `/api` to the API. The API keeps the session and either answers the call or forwards it to the catalog or orders service. Postgres holds the shop data. Redis holds sessions, carts, and a short-lived category cache.

## Processes

```mermaid
flowchart LR
  browser["Browser"]
  shell["Shop shell<br/>Vite :5173"]
  catalogUi["Catalog screens<br/>Vite :5174"]
  ordersUi["Order screens<br/>Vite :5175"]
  api["API<br/>Fastify :4000"]
  catalog["Catalog service<br/>Fastify :4001"]
  orders["Orders service<br/>Fastify :4002"]
  console["Database console<br/>Fastify :4003"]
  pg[("Postgres 16")]
  redis[("Redis 7")]

  browser -->|"HTML, JS, and /api"| shell
  shell -->|"remoteEntry.js"| catalogUi
  shell -->|"remoteEntry.js"| ordersUi
  shell -->|"proxy /api"| api
  api -->|"products and categories"| catalog
  api -->|"cart, checkout, orders, cancel"| orders
  api --> pg
  api --> redis
  catalog --> pg
  catalog --> redis
  orders --> pg
  orders --> redis
  console --> pg
  console --> redis
```

The catalog and orders screens are separate Vite apps. Module federation loads their `remoteEntry.js` into the shell. React and React Router are shared, so those screens render inside the shell's page. Their `fetch("/api/...")` calls still go to port 5173, because that is the page origin. The proxies in the catalog and orders Vite configs matter when those apps are opened directly.

The database console is not behind the shop. Open it at `http://127.0.0.1:4003`. It signs in on its own and stores `datalab_db_session` in Redis.

## One API call

A cart read shows the whole path. The cookie never leaves the shop origin. Vite copies the request to the API, the API checks the session, and the orders service reads the cart.

```mermaid
sequenceDiagram
  participant Browser
  participant Vite as Vite :5173
  participant API as API :4000
  participant Redis
  participant Orders as Orders :4002

  Browser->>Vite: GET /api/cart<br/>Cookie datalab_session
  Vite->>API: GET /api/cart
  API->>Redis: GET session:sid
  API->>Orders: GET /cart<br/>x-datalab-user, x-datalab-role
  Orders->>Redis: GET cart for that user
  Orders-->>API: JSON
  API-->>Vite: JSON
  Vite-->>Browser: JSON
```

`api()` in each frontend calls `fetch` with `credentials: "include"`. A JSON body is sent as `application/json`. A resume upload skips that helper and posts `FormData`, so the browser sets the multipart boundary.

Login writes `session:<sid>` in Redis and sets the `datalab_session` cookie. Later calls on the API read that record. Calls forwarded to catalog or orders also send `x-datalab-user` and `x-datalab-role`. The orders proxy adds `x-datalab-email`.

## Who answers `/api`

| Path | Answered by | Stored in |
| --- | --- | --- |
| `/api/login`, `/api/logout`, `/api/me` | API | Redis session |
| `/api/customers` | API | Postgres `users`, `orders` |
| `/api/products`, `/api/categories` | Catalog service, through the API | Postgres `products`. Category counts cached in Redis for 60 seconds |
| `/api/inventory` | API | Postgres `inventory` (warehouse) |
| `/api/locations` | API | Postgres `locations`, `location_inventory` |
| `/api/jobs`, `/api/applications` | API | Postgres `jobs`, `applications`. Resume files on disk under `server/uploads/resumes` |
| `/api/cart`, `/api/checkout` | Orders service, through the API | Cart in Redis. Checkout writes Postgres `orders` and clears the cart |
| `/api/orders`, `/api/orders/:number/cancel` | Orders service, through the API | Postgres `orders` |
| `/api/orders/:number/pick`, `ship`, `out-for-delivery`, `deliver`, `tracking`, `collect` | API | Postgres `orders`, `shipments`, `tracking_events` |

Checkout for a shipped order reserves warehouse `inventory`. Checkout for pickup copies the store address onto the order, charges no shipping, and decrements `location_inventory`.

## What each store is for

```mermaid
flowchart TB
  subgraph postgres ["Postgres"]
    users["users"]
    products["products"]
    warehouse["inventory"]
    stores["locations and location_inventory"]
    orders["orders, lines, events, shipments"]
    jobs["jobs and applications"]
  end
  subgraph redis ["Redis"]
    sessions["session:sid and db-session:sid"]
    carts["cart for each user"]
    cache["category cache and cache:version"]
  end
```

Placing or cancelling an order increments `cache:version`, which drops the cached category counts on the next read.
