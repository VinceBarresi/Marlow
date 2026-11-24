CREATE TABLE IF NOT EXISTS product_images (
  id text PRIMARY KEY,
  sku text NOT NULL REFERENCES products (sku) ON DELETE CASCADE,
  content_type text NOT NULL,
  relative_path text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size >= 0),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_sku_idx ON product_images (sku);

CREATE UNIQUE INDEX IF NOT EXISTS product_images_sku_primary_idx
  ON product_images (sku)
  WHERE is_primary;
