# API

Sign-in, locations, careers, inventory, and the staff actions for pick, ship, and tracking. Catalog and order calls are forwarded to those services. Listens on [http://127.0.0.1:4000](http://127.0.0.1:4000). API docs are at [http://127.0.0.1:4000/docs](http://127.0.0.1:4000/docs).

Postgres and Redis must already be running. From this directory:

```bash
npm install
npm run dev
```

`npm test` runs the unit tests.

## Tools

- **Fastify** is the HTTP server.
- **@fastify/cookie** stores the `datalab_session` cookie. The session itself is a record in Redis.
- **@fastify/multipart** accepts resume uploads on job applications.
- **@fastify/swagger** and **@fastify/swagger-ui** serve the OpenAPI document in `openapi.json`.
- **node-postgres** (`pg`) talks to Postgres. **ioredis** talks to Redis.
- **tsx** runs the TypeScript source and restarts it when a file changes. `npm run dev` is `tsx watch`.
- **TypeScript** checks the source. tsx transforms it with esbuild.
- Tests use Node's built-in test runner, started through tsx.
