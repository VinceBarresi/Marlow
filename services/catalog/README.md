# Catalog service

Products and categories. Listens on [http://127.0.0.1:4001](http://127.0.0.1:4001). The API on port 4000 forwards `/api` catalog calls here.

Postgres and Redis must already be running. From this directory:

```bash
npm install
npm run dev
```

## Tools

- **Fastify** is the HTTP server.
- **node-postgres** (`pg`) reads products from Postgres. **ioredis** caches category counts.
- **tsx** runs the TypeScript source and restarts it when a file changes. `npm run dev` is `tsx watch`.
- **TypeScript** checks the source. tsx transforms it with esbuild.
