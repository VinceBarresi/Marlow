import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import type pg from "pg";
import {
  addShipmentEvent,
  createShipment,
  shippingUnavailableError,
  updateTrackingNumber,
} from "./shipping-client.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  pool: pg.Pool;
  redis: Redis;
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type OrderRow = {
  id: string;
  status: string;
  user_id: string;
  ship_city: string;
  ship_region: string;
  fulfillment: string;
};

export async function registerCommerce(app: FastifyInstance, { pool, redis, requireUser }: Deps) {
  const carriers = new Set(["UPS", "FedEx", "USPS", "DHL"]);

  async function withOrder(
    number: string,
    run: (client: pg.PoolClient, order: OrderRow) => Promise<string | null>,
  ) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const locked = await client.query<OrderRow>(
        `select id, status, user_id, ship_city, ship_region, fulfillment
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
        return { outcome, order };
      }
      await client.query("commit");
      await redis.incr("cache:version");
      return { outcome: null, order };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async function trackingNumberForOrder(orderId: string) {
    const result = await pool.query<{ tracking_number: string }>(
      `select tracking_number from shipments where order_id = $1`,
      [orderId],
    );
    return result.rows[0]?.tracking_number ?? null;
  }

  function shippingHttpError(error: unknown) {
    const failure = shippingUnavailableError(error);
    return Object.assign(new Error(failure.body.error), { httpStatus: failure.status });
  }

  app.post<{ Params: { number: string } }>("/api/orders/:number/pick", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });
    const found = await withOrder(request.params.number, async (client, order) => {
      if (order.fulfillment === "pickup") return "Pickup orders are collected at the store.";
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
      if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });
      const carrier = text(request.body?.carrier);
      const service = text(request.body?.service) || "Ground";
      if (!carriers.has(carrier) || (service !== "Ground" && service !== "Express")) {
        return reply.code(400).send({ error: "Carrier must be UPS, FedEx, USPS, or DHL." });
      }

      // Validate under lock, then release before calling shipping (avoids FK deadlock).
      const ready = await withOrder(request.params.number, async (_client, order) => {
        if (order.fulfillment === "pickup") return "Pickup orders are collected at the store.";
        if (order.status !== "picking") return "Only picking orders can be shipped.";
        return null;
      });
      if (!ready) return reply.code(404).send({ error: "Order not found." });
      if (ready.outcome) return reply.code(409).send({ error: ready.outcome });

      let tracking = "";
      try {
        const shipment = await createShipment({
          orderId: ready.order.id,
          carrier,
          service,
          shipCity: ready.order.ship_city,
          shipRegion: ready.order.ship_region,
        });
        tracking = shipment.trackingNumber;
      } catch (error) {
        const httpStatus = (shippingHttpError(error) as { httpStatus?: number }).httpStatus ?? 502;
        return reply
          .code(httpStatus)
          .send({ error: error instanceof Error ? error.message : "Shipping failed." });
      }

      const finished = await withOrder(request.params.number, async (client, order) => {
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
        await client.query(`update orders set status = 'shipped' where id = $1`, [order.id]);
        await client.query(
          `insert into order_events (order_id, status, note, created_at, actor_email)
           values ($1, 'shipped', 'Handed to carrier', now(), $2)`,
          [order.id, user.email],
        );
        return null;
      });
      if (!finished) return reply.code(404).send({ error: "Order not found." });
      if (finished.outcome) return reply.code(409).send({ error: finished.outcome });

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
      if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });

      const ready = await withOrder(request.params.number, async (_client, order) => {
        if (order.fulfillment === "pickup") return "Pickup orders are collected at the store.";
        if (order.status !== "shipped") return "Only shipped orders can go out for delivery.";
        return null;
      });
      if (!ready) return reply.code(404).send({ error: "Order not found." });
      if (ready.outcome) return reply.code(409).send({ error: ready.outcome });

      const trackingNumber = await trackingNumberForOrder(ready.order.id);
      if (!trackingNumber)
        return reply.code(409).send({ error: "This order has no shipment yet." });

      try {
        await addShipmentEvent(trackingNumber, {
          status: "out_for_delivery",
          location: `${ready.order.ship_city}, ${ready.order.ship_region}`,
          message: "Out for delivery",
          shipmentStatus: "out_for_delivery",
        });
      } catch (error) {
        const failure = shippingUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }

      const finished = await withOrder(request.params.number, async (client, order) => {
        if (order.status !== "shipped") return "Only shipped orders can go out for delivery.";
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
      if (!finished) return reply.code(404).send({ error: "Order not found." });
      if (finished.outcome) return reply.code(409).send({ error: finished.outcome });
      return { number: request.params.number, status: "out_for_delivery" };
    },
  );

  app.post<{ Params: { number: string } }>(
    "/api/orders/:number/deliver",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });

      const ready = await withOrder(request.params.number, async (_client, order) => {
        if (order.fulfillment === "pickup") return "Pickup orders are collected at the store.";
        if (order.status !== "out_for_delivery") {
          return "Only orders that are out for delivery can be delivered.";
        }
        return null;
      });
      if (!ready) return reply.code(404).send({ error: "Order not found." });
      if (ready.outcome) return reply.code(409).send({ error: ready.outcome });

      const trackingNumber = await trackingNumberForOrder(ready.order.id);
      if (!trackingNumber)
        return reply.code(409).send({ error: "This order has no shipment yet." });

      try {
        await addShipmentEvent(trackingNumber, {
          status: "delivered",
          location: `${ready.order.ship_city}, ${ready.order.ship_region}`,
          message: "Delivered",
          shipmentStatus: "delivered",
        });
      } catch (error) {
        const failure = shippingUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }

      const finished = await withOrder(request.params.number, async (client, order) => {
        if (order.status !== "out_for_delivery") {
          return "Only orders that are out for delivery can be delivered.";
        }
        await client.query(`update orders set status = 'delivered' where id = $1`, [order.id]);
        await client.query(
          `insert into order_events (order_id, status, note, created_at, actor_email)
           values ($1, 'delivered', 'Delivered', now(), $2)`,
          [order.id, user.email],
        );
        return null;
      });
      if (!finished) return reply.code(404).send({ error: "Order not found." });
      if (finished.outcome) return reply.code(409).send({ error: finished.outcome });
      return { number: request.params.number, status: "delivered" };
    },
  );

  app.post<{ Params: { number: string }; Body: { trackingNumber?: string } }>(
    "/api/orders/:number/tracking",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });
      const trackingNumber = text(request.body?.trackingNumber);
      if (trackingNumber.length < 6) {
        return reply.code(400).send({ error: "Enter a tracking number." });
      }

      const ready = await withOrder(request.params.number, async (_client, order) => {
        if (order.fulfillment === "pickup") return "Pickup orders are collected at the store.";
        return null;
      });
      if (!ready) return reply.code(404).send({ error: "Order not found." });
      if (ready.outcome) return reply.code(409).send({ error: ready.outcome });

      const current = await trackingNumberForOrder(ready.order.id);
      if (!current) return reply.code(409).send({ error: "This order has no shipment yet." });

      try {
        await updateTrackingNumber(current, trackingNumber);
      } catch (error) {
        const failure = shippingUnavailableError(error);
        return reply.code(failure.status).send(failure.body);
      }

      return { number: request.params.number, trackingNumber };
    },
  );

  app.post<{ Params: { number: string } }>(
    "/api/orders/:number/collect",
    async (request, reply) => {
      const user = await requireUser(request, reply);
      if (!user) return;
      if (user.role === "customer") return reply.code(403).send({ error: "Staff only." });
      const found = await withOrder(request.params.number, async (client, order) => {
        if (order.fulfillment !== "pickup") return "Only pickup orders can be collected.";
        if (order.status !== "paid") return "Only paid pickup orders can be collected.";
        await client.query(`update orders set status = 'delivered' where id = $1`, [order.id]);
        await client.query(
          `insert into order_events (order_id, status, note, created_at, actor_email)
         values ($1, 'delivered', 'Picked up in store', now(), $2)`,
          [order.id, user.email],
        );
        return null;
      });
      if (!found) return reply.code(404).send({ error: "Order not found." });
      if (found.outcome) return reply.code(409).send({ error: found.outcome });
      return { number: request.params.number, status: "delivered" };
    },
  );
}
