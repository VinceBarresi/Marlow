CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  line1 text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  phone text NOT NULL,
  hours text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL
);

CREATE INDEX IF NOT EXISTS locations_city_idx ON locations (city, name);

CREATE TABLE IF NOT EXISTS location_inventory (
  location_id uuid NOT NULL REFERENCES locations (id),
  sku text NOT NULL REFERENCES products (sku),
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  PRIMARY KEY (location_id, sku)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment text NOT NULL DEFAULT 'ship';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id uuid;

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_fulfillment_check CHECK (fulfillment IN ('ship', 'pickup'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders
    ADD CONSTRAINT orders_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations (id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS orders_location_id_idx ON orders (location_id);

INSERT INTO locations (id, slug, name, city, line1, region, postal_code, phone, hours, latitude, longitude)
VALUES
  ('4b1e6a10-2f44-4c1a-8a11-111111111101', 'austin-domain', 'Marlow Domain', 'Austin', '11600 Domain Drive', 'TX', '78758', '512-555-0142', 'Daily 10am–7pm', 30.4015, -97.7254),
  ('4b1e6a10-2f44-4c1a-8a11-111111111102', 'austin-south-congress', 'Marlow South Congress', 'Austin', '1600 South Congress Avenue', 'TX', '78704', '512-555-0194', 'Daily 11am–7pm', 30.2493, -97.7490),
  ('4b1e6a10-2f44-4c1a-8a11-111111111103', 'dallas-bishop-arts', 'Marlow Bishop Arts', 'Dallas', '419 North Bishop Avenue', 'TX', '75208', '214-555-0168', 'Daily 10am–6pm', 32.7480, -96.8289),
  ('4b1e6a10-2f44-4c1a-8a11-111111111104', 'fort-worth-magnolia', 'Marlow Magnolia', 'Fort Worth', '1400 West Magnolia Avenue', 'TX', '76104', '817-555-0133', 'Daily 10am–6pm', 32.7243, -97.3498),
  ('4b1e6a10-2f44-4c1a-8a11-111111111105', 'houston-heights', 'Marlow Heights', 'Houston', '610 West 19th Street', 'TX', '77008', '713-555-0177', 'Daily 10am–7pm', 29.8024, -95.4042),
  ('4b1e6a10-2f44-4c1a-8a11-111111111106', 'san-antonio-pearl', 'Marlow Pearl', 'San Antonio', '303 Pearl Parkway', 'TX', '78215', '210-555-0119', 'Daily 10am–6pm', 29.4426, -98.4798),
  ('4b1e6a10-2f44-4c1a-8a11-111111111107', 'el-paso-mesa', 'Marlow Mesa', 'El Paso', '2812 North Mesa Street', 'TX', '79902', '915-555-0186', 'Daily 10am–6pm', 31.7778, -106.4955),
  ('4b1e6a10-2f44-4c1a-8a11-111111111108', 'marfa-highland', 'Marlow Highland', 'Marfa', '113 North Highland Avenue', 'TX', '79843', '432-555-0104', 'Thu–Mon 11am–5pm', 30.3110, -104.0205)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO location_inventory (location_id, sku, on_hand)
SELECT
  l.id,
  p.sku,
  CASE
    WHEN abs(hashtext(l.slug || p.sku)::bigint) % 5 = 0 THEN 0
    ELSE (abs(hashtext(l.slug || p.sku)::bigint) % 12) + 1
  END
FROM locations l
CROSS JOIN products p
ON CONFLICT (location_id, sku) DO NOTHING;
