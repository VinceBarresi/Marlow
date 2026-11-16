# Database

Query page for the local Postgres database. It listens on port 4003.

Postgres must already be running. From this directory:

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4003](http://127.0.0.1:4003). The connection defaults to `postgres://datalab:datalab@localhost:5432/datalab`.

Staff can run read-only queries. The admin can also insert, update, and delete. Customers cannot query. Sign in with the accounts in the root README.
