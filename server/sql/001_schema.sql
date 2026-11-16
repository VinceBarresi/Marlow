CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  sku text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_name_idx ON products (name);

CREATE TABLE inventory (
  sku text PRIMARY KEY REFERENCES products (sku),
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  reorder_point integer NOT NULL CHECK (reorder_point >= 0),
  bin text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reserved <= on_hand)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users (id),
  status text NOT NULL CHECK (
    status IN ('paid', 'picking', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  placed_at timestamptz NOT NULL,
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents integer NOT NULL CHECK (shipping_cents >= 0),
  tax_cents integer NOT NULL CHECK (tax_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  ship_name text NOT NULL,
  ship_line1 text NOT NULL,
  ship_city text NOT NULL,
  ship_region text NOT NULL,
  ship_postal_code text NOT NULL,
  ship_country text NOT NULL
);

CREATE INDEX orders_user_id_idx ON orders (user_id);
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_placed_at_idx ON orders (placed_at DESC);

CREATE TABLE order_lines (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE INDEX order_lines_order_id_idx ON order_lines (order_id);

CREATE TABLE order_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  status text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL,
  actor_email text
);

CREATE INDEX order_events_order_id_idx ON order_events (order_id, created_at);

CREATE TABLE shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  carrier text NOT NULL,
  service text NOT NULL,
  tracking_number text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('label_created', 'in_transit', 'out_for_delivery', 'delivered')
  ),
  shipped_at timestamptz NOT NULL,
  estimated_delivery date,
  delivered_at timestamptz
);
