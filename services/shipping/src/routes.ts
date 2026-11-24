import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { requireBearer, type AuthConfig } from "./auth.js";
import type { CarrierClient } from "./carrier.js";
import { signAccessToken } from "./token.js";

const SERVICE_TOKEN_TTL = 3600;
const USER_TOKEN_TTL = 1800;

type Deps = {
  pool: pg.Pool;
  carrier: CarrierClient;
  auth: AuthConfig;
  clientId: string;
  clientSecret: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function registerShipping(app: FastifyInstance, deps: Deps) {
  const { pool, carrier, auth, clientId, clientSecret } = deps;
  const serviceAuth = requireBearer(auth, ["shipping"]);
  const trackAuth = requireBearer(auth, ["shipping", "tracking:read"]);

  app.post<{
    Body: {
      grant_type?: string;
      client_id?: string;
      client_secret?: string;
    };
  }>("/oauth/token", async (request, reply) => {
    const grant = text(request.body?.grant_type) || "client_credentials";
    if (grant !== "client_credentials") {
      return reply.code(400).send({ error: "Unsupported grant_type." });
    }
    const id = text(request.body?.client_id);
    const secret = text(request.body?.client_secret);
    if (id !== clientId || secret !== clientSecret) {
      return reply.code(401).send({ error: "Invalid client credentials." });
    }
    const accessToken = signAccessToken(
      { sub: `service:${id}`, scope: "shipping", typ: "service" },
      auth.tokenSecret,
      SERVICE_TOKEN_TTL,
    );
    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: SERVICE_TOKEN_TTL,
    };
  });

  app.post<{
    Body: { userId?: string; role?: string };
  }>("/oauth/user-token", { preHandler: serviceAuth }, async (request, reply) => {
    const userId = text(request.body?.userId);
    const role = text(request.body?.role);
    if (!userId || !role) {
      return reply.code(400).send({ error: "userId and role are required." });
    }
    if (!["customer", "staff", "admin"].includes(role)) {
      return reply.code(400).send({ error: "Invalid role." });
    }
    const accessToken = signAccessToken(
      { sub: userId, role, scope: "tracking:read", typ: "user" },
      auth.tokenSecret,
      USER_TOKEN_TTL,
    );
    return {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: USER_TOKEN_TTL,
    };
  });

  app.post<{
    Body: {
      orderId?: string;
      carrier?: string;
      service?: string;
      shipCity?: string;
      shipRegion?: string;
    };
  }>("/shipments", { preHandler: serviceAuth }, async (request, reply) => {
    const orderId = text(request.body?.orderId);
    const carrierName = text(request.body?.carrier);
    const service = text(request.body?.service) || "Ground";
    const shipCity = text(request.body?.shipCity) || "Austin";
    const shipRegion = text(request.body?.shipRegion) || "TX";
    const carriers = new Set(["UPS", "FedEx", "USPS", "DHL"]);
    if (!orderId) return reply.code(400).send({ error: "orderId is required." });
    if (!carriers.has(carrierName) || (service !== "Ground" && service !== "Express")) {
      return reply.code(400).send({ error: "Carrier must be UPS, FedEx, USPS, or DHL." });
    }

    const created = await carrier.createShipment({
      carrier: carrierName,
      service,
      shipCity,
      shipRegion,
    });
    const shipmentId = randomUUID();
    await pool.query(
      `insert into shipments (
         id, order_id, carrier, service, tracking_number, status, shipped_at, estimated_delivery
       ) values ($1, $2, $3, $4, $5, $6, now(), current_date + $7::int)`,
      [
        shipmentId,
        orderId,
        carrierName,
        service,
        created.trackingNumber,
        created.status,
        created.estimatedDeliveryDays,
      ],
    );
    await pool.query(
      `insert into tracking_events (shipment_id, status, location, message, happened_at)
       values ($1, $2, $3, $4, now())`,
      [
        shipmentId,
        created.initialScan.status,
        created.initialScan.location,
        created.initialScan.message,
      ],
    );

    return {
      id: shipmentId,
      orderId,
      carrier: carrierName,
      service,
      trackingNumber: created.trackingNumber,
      status: created.status,
    };
  });

  app.get<{ Params: { trackingNumber: string } }>(
    "/track/:trackingNumber",
    { preHandler: trackAuth },
    async (request, reply) => {
      const trackingNumber = text(request.params.trackingNumber);
      const shipment = await pool.query<{
        id: string;
        order_id: string;
        carrier: string;
        service: string;
        tracking_number: string;
        status: string;
        shipped_at: Date;
        estimated_delivery: string | null;
        delivered_at: Date | null;
        user_id: string;
      }>(
        `select s.id, s.order_id, s.carrier, s.service, s.tracking_number, s.status,
                s.shipped_at, s.estimated_delivery, s.delivered_at, o.user_id
         from shipments s
         join orders o on o.id = s.order_id
         where s.tracking_number = $1`,
        [trackingNumber],
      );
      const row = shipment.rows[0];
      if (!row) return reply.code(404).send({ error: "Tracking number not found." });

      const claims = request.shippingAuth!;
      if (claims.typ === "user" && claims.role === "customer" && claims.sub !== row.user_id) {
        return reply.code(403).send({ error: "Not your shipment." });
      }

      const scans = await pool.query<{
        status: string;
        location: string;
        message: string;
        happened_at: Date;
      }>(
        `select status, location, message, happened_at
         from tracking_events
         where shipment_id = $1
         order by happened_at`,
        [row.id],
      );

      return {
        trackingNumber: row.tracking_number,
        carrier: row.carrier,
        service: row.service,
        status: row.status,
        shippedAt: row.shipped_at,
        estimatedDelivery: row.estimated_delivery,
        deliveredAt: row.delivered_at,
        orderId: row.order_id,
        scans: scans.rows.map((scan) => ({
          status: scan.status,
          location: scan.location,
          message: scan.message,
          happenedAt: scan.happened_at,
        })),
      };
    },
  );

  app.post<{
    Params: { trackingNumber: string };
    Body: { status?: string; location?: string; message?: string; shipmentStatus?: string };
  }>("/shipments/:trackingNumber/events", { preHandler: serviceAuth }, async (request, reply) => {
    const trackingNumber = text(request.params.trackingNumber);
    const status = text(request.body?.status);
    const location = text(request.body?.location);
    const message = text(request.body?.message);
    const shipmentStatus = text(request.body?.shipmentStatus);
    if (!status || !location || !message) {
      return reply.code(400).send({ error: "status, location, and message are required." });
    }

    const shipment = await pool.query<{ id: string }>(
      `select id from shipments where tracking_number = $1`,
      [trackingNumber],
    );
    const row = shipment.rows[0];
    if (!row) return reply.code(404).send({ error: "Shipment not found." });

    if (shipmentStatus) {
      await pool.query(
        `update shipments set status = $2,
           delivered_at = case when $2 = 'delivered' then now() else delivered_at end
         where id = $1`,
        [row.id, shipmentStatus],
      );
    }
    await pool.query(
      `insert into tracking_events (shipment_id, status, location, message, happened_at)
       values ($1, $2, $3, $4, now())`,
      [row.id, status, location, message],
    );
    return { ok: true, trackingNumber };
  });

  app.patch<{
    Params: { trackingNumber: string };
    Body: { trackingNumber?: string };
  }>("/shipments/:trackingNumber", { preHandler: serviceAuth }, async (request, reply) => {
    const current = text(request.params.trackingNumber);
    const next = text(request.body?.trackingNumber);
    if (next.length < 6) return reply.code(400).send({ error: "Enter a tracking number." });

    const updated = await pool.query(
      `update shipments set tracking_number = $2 where tracking_number = $1 returning id`,
      [current, next],
    );
    if (updated.rowCount !== 1) return reply.code(404).send({ error: "Shipment not found." });

    await pool.query(
      `insert into tracking_events (shipment_id, status, location, message, happened_at)
       values ($1, 'updated', 'Network', $2, now())`,
      [updated.rows[0].id, `Tracking number updated to ${next}`],
    );
    return { ok: true, trackingNumber: next };
  });
}
