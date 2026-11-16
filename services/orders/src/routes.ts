import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";
import { quote } from "./pricing.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

function seesEveryOrder(role: SessionUser["role"]) {
  return role === "staff" || role === "admin";
}

type Deps = {
  pool: pg.Pool;
  redis: Redis;
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

function caller(request: FastifyRequest, reply: FastifyReply) {
  const id = request.headers["x-datalab-user"];
  const role = request.headers["x-datalab-role"];
  const email = request.headers["x-datalab-email"];
  if (
    typeof id !== "string" ||
    !id ||
    (role !== "customer" && role !== "staff" && role !== "admin") ||
    typeof email !== "string" ||
    !email
  ) {
    reply.code(401).send({ error: "Sign in required." });
    return null;
  }
  return { id, email, name: email, role } satisfies SessionUser;
}

export async function registerOrders(app: FastifyInstance, { pool, redis }: Deps) {
  app.get("/cart", async (request, reply) => {
    const user = caller(request, reply);
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

  app.put<{ Body: { sku?: string; quantity?: number } }>("/cart/items", async (request, reply) => {
    const user = caller(request, reply);
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

  app.delete<{ Params: { sku: string } }>("/cart/items/:sku", async (request, reply) => {
    const user = caller(request, reply);
    if (!user) return;
    const cart = (await readCart(redis, user.id)).filter((line) => line.sku !== request.params.sku);
    await redis.set(cartKey(user.id), JSON.stringify(cart));
    return { ok: true };
  });

  app.post<{ Body: Partial<Address> & { fulfillment?: string; locationId?: string } }>(
    "/checkout",
    async (request, reply) => {
      const user = caller(request, reply);
      if (!user) return;

      const fulfillment = text(request.body?.fulfillment) || "ship";
      if (fulfillment !== "ship" && fulfillment !== "pickup") {
        return reply.code(400).send({ error: "Choose shipping or pickup." });
      }
      const pickup = fulfillment === "pickup";
      const locationId = text(request.body?.locationId);

      let address: Address = {
        shipName: text(request.body?.shipName),
        shipLine1: text(request.body?.shipLine1),
        shipCity: text(request.body?.shipCity),
        shipRegion: text(request.body?.shipRegion),
        shipPostalCode: text(request.body?.shipPostalCode),
        shipCountry: text(request.body?.shipCountry) || "US",
      };
      if (pickup) {
        if (!address.shipName || !locationId) {
          return reply.code(400).send({ error: "A name and a store are required for pickup." });
        }
      } else if (
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
        if (pickup) {
          const store = await client.query<{
            id: string;
            name: string;
            line1: string;
            city: string;
            region: string;
            postal_code: string;
          }>(`select id, name, line1, city, region, postal_code from locations where id = $1`, [
            locationId,
          ]);
          const location = store.rows[0];
          if (!location) {
            await client.query("rollback");
            return reply.code(404).send({ error: "Store not found." });
          }
          address = {
            ...address,
            shipLine1: location.line1,
            shipCity: location.city,
            shipRegion: location.region,
            shipPostalCode: location.postal_code,
            shipCountry: "US",
          };
        }
        const priced: { sku: string; name: string; quantity: number; priceCents: number }[] = [];

        for (const line of cart) {
          const locked = pickup
            ? await client.query<{ name: string; price_cents: number; available: number }>(
                `select p.name, p.price_cents, li.on_hand as available
               from products p
               join location_inventory li on li.sku = p.sku and li.location_id = $2
               where p.sku = $1
               for update of li`,
                [line.sku, locationId],
              )
            : await client.query<{ name: string; price_cents: number; available: number }>(
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
            return reply
              .code(404)
              .send({
                error: pickup
                  ? `${line.sku} is not at this store.`
                  : `Product ${line.sku} not found.`,
              });
          }
          if (row.available < line.quantity) {
            await client.query("rollback");
            return reply.code(409).send({ error: `Not enough stock for ${line.sku}.` });
          }
          if (pickup) {
            await client.query(
              `update location_inventory
             set on_hand = on_hand - $3
             where location_id = $1 and sku = $2`,
              [locationId, line.sku, line.quantity],
            );
          } else {
            await client.query(
              `update inventory
             set reserved = reserved + $2, updated_at = now()
             where sku = $1`,
              [line.sku, line.quantity],
            );
          }
          priced.push({
            sku: line.sku,
            name: row.name,
            quantity: line.quantity,
            priceCents: row.price_cents,
          });
        }

        const subtotal = priced.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
        const pricedQuote = quote(subtotal);
        const shipping = pickup ? 0 : pricedQuote.shippingCents;
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
           ship_name, ship_line1, ship_city, ship_region, ship_postal_code, ship_country,
           fulfillment, location_id
         ) values (
           $1, $2, $3, 'paid', now(),
           $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15
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
            fulfillment,
            pickup ? locationId : null,
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
         values ($1, 'paid', $3, now(), $2)`,
          [orderId, user.email, pickup ? "Held for pickup" : "Payment captured"],
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
    },
  );

  app.get<{ Querystring: { page?: string; pageSize?: string; status?: string } }>(
    "/orders",
    async (request, reply) => {
      const user = caller(request, reply);
      if (!user) return;
      const status = text(request.query.status) || null;
      const { page, pageSize, offset } = pageQuery(request.query);
      const ownerId = seesEveryOrder(user.role) ? null : user.id;
      const filters = [ownerId, status];
      const where = `where ($1::uuid is null or o.user_id = $1) and ($2::text is null or o.status = $2)`;
      const list = await pool.query(
        `select o.number, o.status, o.fulfillment, o.placed_at, o.total_cents, o.ship_city, o.ship_region,
                u.email as customer_email, loc.name as location_name, count(l.id)::int as line_count
         from orders o
         join users u on u.id = o.user_id
         left join locations loc on loc.id = o.location_id
         left join order_lines l on l.order_id = o.id
         ${where}
         group by o.id, u.email, loc.name
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
          fulfillment: row.fulfillment,
          locationName: row.location_name,
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

  app.get<{ Params: { number: string } }>("/orders/:number", async (request, reply) => {
    const user = caller(request, reply);
    if (!user) return;

    const order = await pool.query(
      `select o.id, o.number, o.status, o.fulfillment, o.placed_at, o.subtotal_cents, o.shipping_cents,
              o.tax_cents, o.total_cents, o.ship_name, o.ship_line1, o.ship_city, o.ship_region,
              o.ship_postal_code, o.ship_country, loc.slug as location_slug, loc.name as location_name
       from orders o
       left join locations loc on loc.id = o.location_id
       where o.number = $1 and ($2::uuid is null or o.user_id = $2)`,
      [request.params.number, seesEveryOrder(user.role) ? null : user.id],
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
        fulfillment: row.fulfillment,
        location: row.location_name ? { slug: row.location_slug, name: row.location_name } : null,
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
        fulfillment: string;
        location_id: string | null;
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
        fulfillment: string;
        location_id: string | null;
      }>(
        `select id, status, user_id, ship_city, ship_region, fulfillment, location_id
         from orders where number = $1 for update`,
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

  app.post<{ Params: { number: string } }>("/orders/:number/cancel", async (request, reply) => {
    const user = caller(request, reply);
    if (!user) return;
    const found = await withOrder(request.params.number, async (client, order) => {
      if (!seesEveryOrder(user.role) && order.user_id !== user.id) return "missing";
      if (order.status !== "paid" && order.status !== "picking") {
        return "Only paid or picking orders can be cancelled.";
      }
      const lines = await client.query<{ sku: string; quantity: number }>(
        `select sku, quantity from order_lines where order_id = $1`,
        [order.id],
      );
      for (const line of lines.rows) {
        const updated =
          order.fulfillment === "pickup"
            ? await client.query(
                `update location_inventory
                 set on_hand = on_hand + $3
                 where location_id = $1 and sku = $2`,
                [order.location_id, line.sku, line.quantity],
              )
            : await client.query(
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
    if (!found || found.outcome === "missing")
      return reply.code(404).send({ error: "Order not found." });
    if (found.outcome) return reply.code(409).send({ error: found.outcome });
    return { number: request.params.number, status: "cancelled" };
  });
}
