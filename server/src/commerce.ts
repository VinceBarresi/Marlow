import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";

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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function registerCommerce(app: FastifyInstance, { pool, redis, requireUser }: Deps) {
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
      return {
        number: request.params.number,
        status: "shipped",
        carrier,
        service,
        trackingNumber: tracking,
      };
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
        await client.query(`update shipments set status = 'out_for_delivery' where order_id = $1`, [
          order.id,
        ]);
        await addScan(
          client,
          order.id,
          "out_for_delivery",
          `${order.ship_city}, ${order.ship_region}`,
          "Out for delivery",
        );
        await client.query(`update orders set status = 'out_for_delivery' where id = $1`, [
          order.id,
        ]);
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

  app.post<{ Params: { number: string } }>(
    "/api/orders/:number/deliver",
    async (request, reply) => {
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
    },
  );

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
