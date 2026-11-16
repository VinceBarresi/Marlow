CREATE TABLE IF NOT EXISTS tracking_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES shipments (id) ON DELETE CASCADE,
  status text NOT NULL,
  location text NOT NULL,
  message text NOT NULL,
  happened_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS tracking_events_shipment_idx
  ON tracking_events (shipment_id, happened_at);

INSERT INTO tracking_events (shipment_id, status, location, message, happened_at)
SELECT
  s.id,
  CASE e.status WHEN 'shipped' THEN 'in_transit' ELSE e.status END,
  CASE
    WHEN e.status = 'shipped' THEN 'Austin, TX'
    ELSE o.ship_city || ', ' || o.ship_region
  END,
  CASE e.status
    WHEN 'shipped' THEN 'Picked up by ' || s.carrier
    WHEN 'out_for_delivery' THEN 'Out for delivery'
    ELSE 'Delivered'
  END,
  e.created_at
FROM shipments s
JOIN orders o ON o.id = s.order_id
JOIN order_events e ON e.order_id = o.id
  AND e.status IN ('shipped', 'out_for_delivery', 'delivered')
WHERE NOT EXISTS (
  SELECT 1 FROM tracking_events te WHERE te.shipment_id = s.id
);
