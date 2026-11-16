import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import cookie from "@fastify/cookie";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import Redis from "ioredis";
import pg from "pg";

const scryptAsync = promisify(scrypt);
const WEEK = 60 * 60 * 24 * 7;
const ROW_LIMIT = 200;
const READ = new Set(["select", "with", "explain"]);
const WRITE = new Set(["insert", "update", "delete"]);
const BLOCKED = new Set(["drop", "alter", "truncate", "create", "grant", "revoke"]);

type Role = "customer" | "staff" | "admin";
type SessionUser = { id: string; email: string; name: string; role: Role };

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function keywordOf(sql: string) {
  return (
    sql
      .replace(/^\/\*[\s\S]*?\*\//, "")
      .trim()
      .split(/\s+/)[0]
      ?.toLowerCase() ?? ""
  );
}

function prepareSql(input: unknown) {
  if (typeof input !== "string") return { error: "Enter a SQL statement." };
  let sql = input.trim();
  if (sql.endsWith(";")) sql = sql.slice(0, -1).trim();
  if (!sql) return { error: "Enter a SQL statement." };
  if (sql.includes(";")) return { error: "Run one statement at a time." };
  return { sql, keyword: keywordOf(sql) };
}

function permissionError(role: Role, sql: string, keyword: string) {
  if (role === "customer") return "Customers cannot query the database.";
  if (BLOCKED.has(keyword)) return "Schema changes are not allowed here.";
  const writes = WRITE.has(keyword) || /\b(insert|update|delete)\b/i.test(sql);
  if (writes && role !== "admin") return "Only an admin can change data.";
  if (!READ.has(keyword) && !(role === "admin" && WRITE.has(keyword))) {
    return "That statement is not allowed.";
  }
  return null;
}

function cell(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  return value;
}

async function sessionUser(request: FastifyRequest) {
  const sid = request.cookies.datalab_db_session;
  if (!sid) return null;
  const raw = await redis.get(`db-session:${sid}`);
  if (!raw) return null;
  return JSON.parse(raw) as SessionUser;
}

async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const user = await sessionUser(request);
  if (!user) {
    reply.code(401).send({ error: "Sign in required." });
    return null;
  }
  return user;
}

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Marlow database</title>
  <style>
    :root { color: #1c1915; background: #f3efe6; font: 16px/1.45 "Avenir Next", "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 40px; }
    h1 { font-family: Palatino, Georgia, serif; font-weight: 500; font-size: 2rem; margin: 0 0 8px; }
    p, label { color: #6f685c; }
    label { display: grid; gap: 4px; font-size: 0.85rem; }
    .login { max-width: 420px; background: #fffdf8; border: 1px solid #e3dacb; border-radius: 12px; padding: 24px; display: grid; gap: 12px; }
    .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
    button, textarea, input { font: inherit; color: inherit; }
    input, textarea { width: 100%; border: 1px solid #e3dacb; border-radius: 8px; padding: 10px; background: #fffdf8; }
    textarea { min-height: 140px; }
    button { background: #1f6b45; color: #f4fff8; border: 0; border-radius: 6px; padding: 9px 14px; cursor: pointer; }
    button.quiet { background: transparent; color: #1c1915; border: 1px solid #e3dacb; }
    .tables { display: grid; align-content: start; gap: 6px; }
    .tables button { background: #fffdf8; color: #1c1915; border: 1px solid #e3dacb; text-align: left; }
    .error { color: #8e2e2e; }
    .meta { color: #6f685c; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; background: #fffdf8; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e3dacb; vertical-align: top; }
    th { font-size: 0.78rem; letter-spacing: 0.04em; text-transform: uppercase; color: #6f685c; }
    [hidden] { display: none !important; }
    @media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main data-testid="db-page">
    <h1 data-testid="db-title">Database</h1>
    <form class="login" data-testid="db-login" hidden>
      <p data-testid="db-login-lede">Staff can read. Admins can also insert, update, and delete.</p>
      <label>Email <input data-testid="db-email" name="email" autocomplete="username" value="staff@marlow.test" /></label>
      <label>Password <input data-testid="db-password" name="password" type="password" autocomplete="current-password" value="datalab" /></label>
      <p class="error" data-testid="db-login-error" hidden></p>
      <button type="submit" data-testid="db-login-submit">Sign in</button>
    </form>
    <section data-testid="db-console" hidden>
      <div class="bar">
        <p data-testid="db-role"></p>
        <button class="quiet" type="button" data-testid="db-logout">Log out</button>
      </div>
      <p class="error" data-testid="db-denied" hidden>Customers cannot query the database.</p>
      <div class="layout" data-testid="db-workspace">
        <div class="tables" data-testid="db-tables"></div>
        <form data-testid="db-form">
          <textarea data-testid="db-sql" name="sql">select table_name from information_schema.tables where table_schema = 'public' order by table_name</textarea>
          <p><button type="submit" data-testid="db-run">Run</button></p>
          <p class="error" data-testid="db-error" hidden></p>
          <p class="meta" data-testid="db-meta"></p>
          <div data-testid="db-results"></div>
        </form>
      </div>
    </section>
  </main>
  <script>
    const login = document.querySelector("[data-testid=db-login]");
    const loginError = document.querySelector("[data-testid=db-login-error]");
    const consolePanel = document.querySelector("[data-testid=db-console]");
    const roleLine = document.querySelector("[data-testid=db-role]");
    const denied = document.querySelector("[data-testid=db-denied]");
    const workspace = document.querySelector("[data-testid=db-workspace]");
    const tables = document.querySelector("[data-testid=db-tables]");
    const form = document.querySelector("[data-testid=db-form]");
    const sql = document.querySelector("[data-testid=db-sql]");
    const error = document.querySelector("[data-testid=db-error]");
    const meta = document.querySelector("[data-testid=db-meta]");
    const results = document.querySelector("[data-testid=db-results]");

    function show(el, message) {
      el.hidden = !message;
      el.textContent = message || "";
    }

    function render(payload) {
      show(error, payload.error || "");
      const count = payload.rowCount ?? 0;
      meta.textContent = payload.columns
        ? count + " rows" + (payload.truncated ? ", showing the first 200" : "")
        : payload.command ? count + " rows affected" : "";
      results.replaceChildren();
      if (!payload.columns || payload.columns.length === 0) return;
      const table = document.createElement("table");
      table.dataset.testid = "db-result-table";
      const head = document.createElement("tr");
      for (const column of payload.columns) {
        const cell = document.createElement("th");
        cell.textContent = column;
        head.append(cell);
      }
      const thead = document.createElement("thead");
      thead.append(head);
      const tbody = document.createElement("tbody");
      for (const [index, row] of payload.rows.entries()) {
        const tr = document.createElement("tr");
        tr.dataset.testid = "db-result-row-" + index;
        for (const column of payload.columns) {
          const td = document.createElement("td");
          const value = row[column];
          td.textContent = value === null || value === undefined ? "" : String(value);
          tr.append(td);
        }
        tbody.append(tr);
      }
      table.append(thead, tbody);
      results.append(table);
    }

    async function run(statement) {
      const response = await fetch("/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql: statement }),
      });
      render(await response.json());
    }

    async function loadTables() {
      tables.replaceChildren();
      const response = await fetch("/tables");
      if (!response.ok) return;
      const listed = await response.json();
      for (const name of listed.tables) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.testid = "db-table-" + name;
        button.textContent = name;
        button.addEventListener("click", () => {
          sql.value = 'select * from "' + name.replaceAll('"', '""') + '" limit 50';
          run(sql.value);
        });
        tables.append(button);
      }
    }

    async function showSession(user) {
      login.hidden = Boolean(user);
      consolePanel.hidden = !user;
      if (!user) return;
      const write = user.role === "admin" ? "Can change rows." : "Read only.";
      roleLine.textContent = user.email + " · " + user.role + " · " + write;
      const allowed = user.role === "staff" || user.role === "admin";
      denied.hidden = allowed;
      workspace.hidden = !allowed;
      if (allowed && tables.childElementCount === 0) {
        await loadTables();
        run(sql.value);
      }
    }

    login.addEventListener("submit", async (event) => {
      event.preventDefault();
      show(loginError, "");
      const response = await fetch("/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: login.email.value,
          password: login.password.value,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        show(loginError, payload.error || "Could not sign in.");
        return;
      }
      await showSession(payload.user);
    });

    document.querySelector("[data-testid=db-logout]").addEventListener("click", async () => {
      await fetch("/logout", { method: "POST" });
      tables.replaceChildren();
      results.replaceChildren();
      meta.textContent = "";
      await showSession(null);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      run(sql.value);
    });

    (async () => {
      const session = await fetch("/me");
      await showSession(session.ok ? (await session.json()).user : null);
    })();
  </script>
</body>
</html>`;

const app = Fastify({ logger: true });
await app.register(cookie);

app.get("/", async (_request, reply) => reply.type("text/html; charset=utf-8").send(page));

app.get("/health", async () => {
  await pool.query("select 1");
  return { ok: true, service: "db" };
});

app.post<{ Body: { email?: string; password?: string } }>("/login", async (request, reply) => {
  const email = request.body?.email?.trim().toLowerCase() ?? "";
  const password = request.body?.password ?? "";
  if (!email || !password) return reply.code(400).send({ error: "Enter an email and password." });

  const result = await pool.query<SessionUser & { password_hash: string }>(
    "select id, email, name, role, password_hash from users where email = $1",
    [email],
  );
  const row = result.rows[0];
  const valid = row ? await verifyPassword(password, row.password_hash) : false;
  if (!row || !valid) return reply.code(401).send({ error: "Email or password is wrong." });

  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const sid = randomBytes(32).toString("hex");
  await redis.set(`db-session:${sid}`, JSON.stringify(user), "EX", WEEK);
  reply.setCookie("datalab_db_session", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
  return { user };
});

app.post("/logout", async (request, reply) => {
  const sid = request.cookies.datalab_db_session;
  if (sid) await redis.del(`db-session:${sid}`);
  reply.clearCookie("datalab_db_session", { path: "/" });
  return { ok: true };
});

app.get("/me", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  return { user };
});

app.get("/tables", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  if (user.role === "customer")
    return reply.code(403).send({ error: "Customers cannot query the database." });
  const result = await pool.query<{ table_name: string }>(
    `select table_name
     from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`,
  );
  return { tables: result.rows.map((row) => row.table_name) };
});

app.post<{ Body: { sql?: string } }>("/query", async (request, reply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  const parsed = prepareSql(request.body?.sql);
  if ("error" in parsed) return reply.code(400).send(parsed);
  const denied = permissionError(user.role, parsed.sql, parsed.keyword);
  if (denied) return reply.code(403).send({ error: denied });

  const write =
    WRITE.has(parsed.keyword) ||
    (user.role === "admin" && /\b(insert|update|delete)\b/i.test(parsed.sql));
  const client = await pool.connect();
  try {
    await client.query("begin");
    if (!write) await client.query("set transaction read only");
    const result = await client.query(parsed.sql);
    if (write) await client.query("commit");
    const rows = result.rows.slice(0, ROW_LIMIT).map((row) => {
      const copy: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) copy[key] = cell(value);
      return copy;
    });
    return {
      command: result.command,
      columns: result.fields.map((field) => field.name),
      rows,
      rowCount: result.rowCount ?? rows.length,
      truncated: result.rows.length > ROW_LIMIT,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed.";
    return reply.code(400).send({ error: message });
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
  }
});

const port = Number(process.env.PORT ?? 4003);
await app.listen({ port, host: "127.0.0.1" });
