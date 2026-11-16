import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";
import { quote } from "./pricing.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff";
};

type Deps = {
  pool: pg.Pool;
  redis: Redis;
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

type CartLine = { sku: string; quantity: number };

type Address = {
  shipName: string;
  shipLine1: string;
  shipCity: string;
  shipRegion: string;
  shipPostalCode: string;
  shipCountry: string;
};

function cartKey(userId: string) {
  return `cart:${userId}`;
}

async function readCart(redis: Redis, userId: string) {
  const raw = await redis.get(cartKey(userId));
  if (!raw) return [] as CartLine[];
  const parsed = JSON.parse(raw) as CartLine[];
  return parsed.filter((line) => line.quantity > 0);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pageQuery(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export async function registerCommerce(app: FastifyInstance, { pool, redis, requireUser }: Deps) {
  app.get("/api/cart", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const cart = await readCart(redis, user.id);
    if (cart.length === 0) return { items: [], subtotalCents: 0 };

    const result = await pool.query<{
      sku: string;
      name: string;
      price_cents: number;
      available: number;
    }>(
      `select p.sku, p.name, p.price_cents, i.on_hand - i.reserved as available
       from products p
       join inventory i on i.sku = p.sku
       where p.sku = any($1::text[])`,
      [cart.map((line) => line.sku)],
    );
    const bySku = new Map(result.rows.map((row) => [row.sku, row]));
    const items = cart.flatMap((line) => {
      const product = bySku.get(line.sku);
      if (!product) return [];
      return [
        {
          sku: product.sku,
          name: product.name,
          priceCents: product.price_cents,
          quantity: line.quantity,
          available: product.available,
          lineTotalCents: product.price_cents * line.quantity,
        },
      ];
    });
    return {
      items,
      subtotalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    };
  });

  app.put<{ Body: { sku?: string; quantity?: number } }>("/api/cart/items", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const sku = text(request.body?.sku);
    const quantity = request.body?.quantity;
    if (!sku || !Number.isInteger(quantity) || quantity === undefined || quantity < 0) {
      return reply.code(400).send({ error: "Send a sku and a whole-number quantity." });
    }

    const product = await pool.query<{ available: number }>(
      `select i.on_hand - i.reserved as available
       from products p
       join inventory i on i.sku = p.sku
       where p.sku = $1`,
      [sku],
    );
    if (!product.rows[0]) return reply.code(404).send({ error: "Product not found." });
    if (quantity > product.rows[0].available) {
      return reply.code(409).send({ error: `Only ${product.rows[0].available} available.` });
    }

    const cart = (await readCart(redis, user.id)).filter((line) => line.sku !== sku);
    if (quantity > 0) cart.push({ sku, quantity });
    await redis.set(cartKey(user.id), JSON.stringify(cart));
    return { ok: true, sku, quantity };
  });

  app.delete<{ Params: { sku: string } }>("/api/cart/items/:sku", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const cart = (await readCart(redis, user.id)).filter((line) => line.sku !== request.params.sku);
    await redis.set(cartKey(user.id), JSON.stringify(cart));
    return { ok: true };
  });

  app.post<{ Body: Partial<Address> }>("/api/checkout", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const address: Address = {
      shipName: text(request.body?.shipName),
      shipLine1: text(request.body?.shipLine1),
      shipCity: text(request.body?.shipCity),
      shipRegion: text(request.body?.shipRegion),
      shipPostalCode: text(request.body?.shipPostalCode),
      shipCountry: text(request.body?.shipCountry) || "US",
    };
    if (
      !address.shipName ||
      !address.shipLine1 ||
      !address.shipCity ||
      !address.shipRegion ||
      !address.shipPostalCode
    ) {
      return reply.code(400).send({ error: "A shipping name and address are required." });
    }

    const cart = await readCart(redis, user.id);
    if (cart.length === 0) return reply.code(400).send({ error: "Cart is empty." });

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(42)");
      const priced: { sku: string; name: string; quantity: number; priceCents: number }[] = [];

      for (const line of cart) {
        const locked = await client.query<{ name: string; price_cents: number; available: number }>(
          `select p.name, p.price_cents, i.on_hand - i.reserved as available
           from products p
           join inventory i on i.sku = p.sku
           where p.sku = $1
           for update of i`,
          [line.sku],
        );
        const row = locked.rows[0];
        if (!row) {
          await client.query("rollback");
          return reply.code(404).send({ error: `Product ${line.sku} not found.` });
        }
        if (row.available < line.quantity) {
          await client.query("rollback");
          return reply.code(409).send({ error: `Not enough stock for ${line.sku}.` });
        }
        await client.query(
          `update inventory
           set reserved = reserved + $2, updated_at = now()
           where sku = $1`,
          [line.sku, line.quantity],
        );
        priced.push({
          sku: line.sku,
          name: row.name,
          quantity: line.quantity,
          priceCents: row.price_cents,
        });
      }

      const subtotal = priced.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
      const pricedQuote = quote(subtotal);
      const shipping = pricedQuote.shippingCents;
      const tax = pricedQuote.taxCents;
      const next = await client.query<{ next: number }>(
        `select coalesce(max(substring(number from 5)::int), 100000) + 1 as next from orders`,
      );
      const number = `MRW-${next.rows[0]?.next ?? 100001}`;
      const orderId = randomUUID();

      await client.query(
        `insert into orders (
           id, number, user_id, status, placed_at,
           subtotal_cents, shipping_cents, tax_cents, total_cents,
           ship_name, ship_line1, ship_city, ship_region, ship_postal_code, ship_country
         ) values (
           $1, $2, $3, 'paid', now(),
           $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13
         )`,
        [
          orderId,
          number,
          user.id,
          subtotal,
          shipping,
          tax,
          subtotal + shipping + tax,
          address.shipName,
          address.shipLine1,
          address.shipCity,
          address.shipRegion,
          address.shipPostalCode,
          address.shipCountry,
        ],
      );

      for (const line of priced) {
        await client.query(
          `insert into order_lines (order_id, sku, name, quantity, unit_price_cents)
           values ($1, $2, $3, $4, $5)`,
          [orderId, line.sku, line.name, line.quantity, line.priceCents],
        );
      }

      await client.query(
        `insert into order_events (order_id, status, note, created_at, actor_email)
         values ($1, 'paid', 'Payment captured', now(), $2)`,
        [orderId, user.email],
      );
      await client.query("commit");
      await redis.del(cartKey(user.id));
      await redis.incr("cache:version");
      return reply.code(201).send({
        order: {
          number,
          status: "paid",
          subtotalCents: subtotal,
          shippingCents: shipping,
          taxCents: tax,
          totalCents: subtotal + shipping + tax,
        },
      });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });

  app.get<{ Querystring: { page?: string; pageSize?: string; status?: string } }>(
    "/api/orders",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      const status = text(request.query.status) || null;
      const { page, pageSize, offset } = pageQuery(request.query);
      const ownerId = user.role === "staff" ? null : user.id;
      const filters = [ownerId, status];
      const where = `where ($1::uuid is null or o.user_id = $1) and ($2::text is null or o.status = $2)`;
      const list = await pool.query(
        `select o.number, o.status, o.placed_at, o.total_cents, o.ship_city, o.ship_region,
                u.email as customer_email, count(l.id)::int as line_count
         from orders o
         join users u on u.id = o.user_id
         left join order_lines l on l.order_id = o.id
         ${where}
         group by o.id, u.email
         order by o.placed_at desc
         limit $3 offset $4`,
        [...filters, pageSize, offset],
      );
      const count = await pool.query<{ total: number }>(
        `select count(*)::int as total from orders o ${where}`,
        filters,
      );
      return {
        orders: list.rows.map((row) => ({
          number: row.number,
          status: row.status,
          placedAt: row.placed_at,
          totalCents: row.total_cents,
          shipCity: row.ship_city,
          shipRegion: row.ship_region,
          customerEmail: row.customer_email,
          lineCount: row.line_count,
        })),
        page,
        pageSize,
        total: count.rows[0]?.total ?? 0,
      };
    },
  );

  app.get<{ Params: { number: string } }>("/api/orders/:number", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const order = await pool.query(
      `select id, number, status, placed_at, subtotal_cents, shipping_cents, tax_cents, total_cents,
              ship_name, ship_line1, ship_city, ship_region, ship_postal_code, ship_country
       from orders
       where number = $1 and ($2::uuid is null or user_id = $2)`,
      [request.params.number, user.role === "staff" ? null : user.id],
    );
    const row = order.rows[0];
    if (!row) return reply.code(404).send({ error: "Order not found." });

    const [lineResult, eventResult, shipmentResult, scanResult] = await Promise.all([
      pool.query(
        `select sku, name, quantity, unit_price_cents
         from order_lines
         where order_id = $1
         order by id`,
        [row.id],
      ),
      pool.query(
        `select status, note, created_at, actor_email
         from order_events
         where order_id = $1
         order by created_at, id`,
        [row.id],
      ),
      pool.query(
        `select id, carrier, service, tracking_number, status, shipped_at, estimated_delivery, delivered_at
         from shipments
         where order_id = $1`,
        [row.id],
      ),
      pool.query(
        `select te.status, te.location, te.message, te.happened_at
         from tracking_events te
         join shipments s on s.id = te.shipment_id
         where s.order_id = $1
         order by te.happened_at, te.id`,
        [row.id],
      ),
    ]);
    const shipment = shipmentResult.rows[0];

    return {
      order: {
        number: row.number,
        status: row.status,
        placedAt: row.placed_at,
        subtotalCents: row.subtotal_cents,
        shippingCents: row.shipping_cents,
        taxCents: row.tax_cents,
        totalCents: row.total_cents,
        shipTo: {
          name: row.ship_name,
          line1: row.ship_line1,
          city: row.ship_city,
          region: row.ship_region,
          postalCode: row.ship_postal_code,
          country: row.ship_country,
        },
        lines: lineResult.rows.map((line) => ({
          sku: line.sku,
          name: line.name,
          quantity: line.quantity,
          unitPriceCents: line.unit_price_cents,
          lineTotalCents: line.unit_price_cents * line.quantity,
        })),
        events: eventResult.rows.map((event) => ({
          status: event.status,
          note: event.note,
          createdAt: event.created_at,
          actorEmail: event.actor_email,
        })),
        shipment: shipment
          ? {
              carrier: shipment.carrier,
              service: shipment.service,
              trackingNumber: shipment.tracking_number,
              status: shipment.status,
              shippedAt: shipment.shipped_at,
              estimatedDelivery: shipment.estimated_delivery,
              deliveredAt: shipment.delivered_at,
              scans: scanResult.rows.map((scan) => ({
                status: scan.status,
                location: scan.location,
                message: scan.message,
                happenedAt: scan.happened_at,
              })),
            }
          : null,
      },
    };
  });

  const carriers = new Set(["UPS", "FedEx", "USPS", "DHL"]);

  async function addScan(
    client: pg.PoolClient,
    orderId: string,
    status: string,
    location: string,
    message: string,
  ) {
    await client.query(
      `insert into tracking_events (shipment_id, status, location, message, happened_at)
       select id, $2, $3, $4, now() from shipments where order_id = $1`,
      [orderId, status, location, message],
    );
  }

  async function withOrder(
    number: string,
    run: (
      client: pg.PoolClient,
      order: {
        id: string;
        status: string;
        user_id: string;
        ship_city: string;
        ship_region: string;
      },
    ) => Promise<string | null>,
  ) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const locked = await client.query<{
        id: string;
        status: string;
        user_id: string;
        ship_city: string;
        ship_region: string;
      }>(
        `select id, status, user_id, ship_city, ship_region from orders where number = $1 for update`,
        [number],
      );
      const order = locked.rows[0];
      if (!order) {
        await client.query("rollback");
        return null;
      }
      const outcome = await run(client, order);
      if (outcome) {
        await client.query("rollback");
        return { outcome };
      }
      await client.query("commit");
      await redis.incr("cache:version");
      return { outcome: null };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  app.post<{ Params: { number: string } }>("/api/orders/:number/cancel", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const found = await withOrder(request.params.number, async (client, order) => {
      if (user.role !== "staff" && order.user_id !== user.id) return "missing";
      if (order.status !== "paid" && order.status !== "picking") {
        return "Only paid or picking orders can be cancelled.";
      }
      const lines = await client.query<{ sku: string; quantity: number }>(
        `select sku, quantity from order_lines where order_id = $1`,
        [order.id],
      );
      for (const line of lines.rows) {
        const updated = await client.query(
          `update inventory
           set reserved = reserved - $2, updated_at = now()
           where sku = $1 and reserved >= $2`,
          [line.sku, line.quantity],
        );
        if (updated.rowCount !== 1) throw new Error(`Could not release stock for ${line.sku}.`);
      }
      await client.query(`update orders set status = 'cancelled' where id = $1`, [order.id]);
      await client.query(
        `insert into order_events (order_id, status, note, created_at, actor_email)
         values ($1, 'cancelled', 'Cancelled before shipment', now(), $2)`,
        [order.id, user.email],
      );
      return null;
    });
    if (!found || found.outcome === "missing") return reply.code(404).send({ error: "Order not found." });
    if (found.outcome) return reply.code(409).send({ error: found.outcome });
    return { number: request.params.number, status: "cancelled" };
  });

  app.post<{ Params: { number: string } }>("/api/orders/:number/pick", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });
    const found = await withOrder(request.params.number, async (client, order) => {
      if (order.status !== "paid") return "Only paid orders can be picked.";
      await client.query(`update orders set status = 'picking' where id = $1`, [order.id]);
      await client.query(
        `insert into order_events (order_id, status, note, created_at, actor_email)
         values ($1, 'picking', 'Pick started', now(), $2)`,
        [order.id, user.email],
      );
      return null;
    });
    if (!found) return reply.code(404).send({ error: "Order not found." });
    if (found.outcome) return reply.code(409).send({ error: found.outcome });
    return { number: request.params.number, status: "picking" };
  });

  app.post<{ Params: { number: string }; Body: { carrier?: string; service?: string } }>(
    "/api/orders/:number/ship",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });
      const carrier = text(request.body?.carrier);
      const service = text(request.body?.service) || "Ground";
      if (!carriers.has(carrier) || (service !== "Ground" && service !== "Express")) {
        return reply.code(400).send({ error: "Carrier must be UPS, FedEx, USPS, or DHL." });
      }
      let tracking = "";
      const found = await withOrder(request.params.number, async (client, order) => {
        if (order.status !== "picking") return "Only picking orders can be shipped.";
        const lines = await client.query<{ sku: string; quantity: number }>(
          `select sku, quantity from order_lines where order_id = $1`,
          [order.id],
        );
        for (const line of lines.rows) {
          const updated = await client.query(
            `update inventory
             set on_hand = on_hand - $2, reserved = reserved - $2, updated_at = now()
             where sku = $1 and reserved >= $2 and on_hand >= $2`,
            [line.sku, line.quantity],
          );
          if (updated.rowCount !== 1) throw new Error(`Could not ship stock for ${line.sku}.`);
        }
        tracking = `${carrier === "UPS" ? "1Z" : carrier === "USPS" ? "9400" : ""}${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
        await client.query(
          `insert into shipments (
             id, order_id, carrier, service, tracking_number, status, shipped_at, estimated_delivery
           ) values ($1, $2, $3, $4, $5, 'in_transit', now(), current_date + 3)`,
          [randomUUID(), order.id, carrier, service, tracking],
        );
        await addScan(client, order.id, "in_transit", "Austin, TX", `Picked up by ${carrier}`);
        await client.query(`update orders set status = 'shipped' where id = $1`, [order.id]);
        await client.query(
          `insert into order_events (order_id, status, note, created_at, actor_email)
           values ($1, 'shipped', 'Handed to carrier', now(), $2)`,
          [order.id, user.email],
        );
        return null;
      });
      if (!found) return reply.code(404).send({ error: "Order not found." });
      if (found.outcome) return reply.code(409).send({ error: found.outcome });
      return { number: request.params.number, status: "shipped", carrier, service, trackingNumber: tracking };
    },
  );

  app.post<{ Params: { number: string } }>(
    "/api/orders/:number/out-for-delivery",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });
      const found = await withOrder(request.params.number, async (client, order) => {
        if (order.status !== "shipped") return "Only shipped orders can go out for delivery.";
        await client.query(
          `update shipments set status = 'out_for_delivery' where order_id = $1`,
          [order.id],
        );
        await addScan(
          client,
          order.id,
          "out_for_delivery",
          `${order.ship_city}, ${order.ship_region}`,
          "Out for delivery",
        );
        await client.query(`update orders set status = 'out_for_delivery' where id = $1`, [order.id]);
        await client.query(
          `insert into order_events (order_id, status, note, created_at, actor_email)
           values ($1, 'out_for_delivery', 'Out for delivery', now(), $2)`,
          [order.id, user.email],
        );
        return null;
      });
      if (!found) return reply.code(404).send({ error: "Order not found." });
      if (found.outcome) return reply.code(409).send({ error: found.outcome });
      return { number: request.params.number, status: "out_for_delivery" };
    },
  );

  app.post<{ Params: { number: string } }>("/api/orders/:number/deliver", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });
    const found = await withOrder(request.params.number, async (client, order) => {
      if (order.status !== "out_for_delivery") {
        return "Only orders that are out for delivery can be delivered.";
      }
      await client.query(
        `update shipments set status = 'delivered', delivered_at = now() where order_id = $1`,
        [order.id],
      );
      await addScan(
        client,
        order.id,
        "delivered",
        `${order.ship_city}, ${order.ship_region}`,
        "Delivered",
      );
      await client.query(`update orders set status = 'delivered' where id = $1`, [order.id]);
      await client.query(
        `insert into order_events (order_id, status, note, created_at, actor_email)
         values ($1, 'delivered', 'Delivered', now(), $2)`,
        [order.id, user.email],
      );
      return null;
    });
    if (!found) return reply.code(404).send({ error: "Order not found." });
    if (found.outcome) return reply.code(409).send({ error: found.outcome });
    return { number: request.params.number, status: "delivered" };
  });

  app.post<{ Params: { number: string }; Body: { trackingNumber?: string } }>(
    "/api/orders/:number/tracking",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role !== "staff") return reply.code(403).send({ error: "Staff only." });
      const trackingNumber = text(request.body?.trackingNumber);
      if (trackingNumber.length < 6) {
        return reply.code(400).send({ error: "Enter a tracking number." });
      }
      const found = await withOrder(request.params.number, async (client, order) => {
        const updated = await client.query(
          `update shipments set tracking_number = $2 where order_id = $1`,
          [order.id, trackingNumber],
        );
        if (updated.rowCount !== 1) return "This order has no shipment yet.";
        await addScan(
          client,
          order.id,
          "updated",
          `${order.ship_city}, ${order.ship_region}`,
          `Tracking number updated to ${trackingNumber}`,
        );
        return null;
      });
      if (!found) return reply.code(404).send({ error: "Order not found." });
      if (found.outcome) return reply.code(409).send({ error: found.outcome });
      return { number: request.params.number, trackingNumber };
    },
  );
}
