# Orders service

Cart, checkout, order history, and cancel. Listens on [http://127.0.0.1:4002](http://127.0.0.1:4002). The API on port 4000 forwards `/api` order calls here.

Postgres and Redis must already be running. From this directory:

```bash
npm install
npm run dev
```

## Tools

- **Fastify** is the HTTP server.
- **node-postgres** (`pg`) stores carts and orders in Postgres. **ioredis** holds the cart for the signed-in session.
- **tsx** runs the TypeScript source and restarts it when a file changes. `npm run dev` is `tsx watch`.
- **TypeScript** checks the source. tsx transforms it with esbuild.
