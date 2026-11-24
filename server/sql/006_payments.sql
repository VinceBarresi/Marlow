CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  customer_ref uuid NOT NULL,
  brand text NOT NULL,
  last4 text NOT NULL,
  exp_month integer NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
  exp_year integer NOT NULL CHECK (exp_year >= 2000),
  fingerprint text NOT NULL,
  test_card_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  detached_at timestamptz
);

CREATE INDEX IF NOT EXISTS payment_methods_customer_ref_idx
  ON payment_methods (customer_ref)
  WHERE detached_at IS NULL;

CREATE TABLE IF NOT EXISTS payment_intents (
  id text PRIMARY KEY,
  customer_ref uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (
    status IN ('requires_payment_method', 'requires_confirmation', 'succeeded', 'canceled')
  ),
  payment_method_id text REFERENCES payment_methods (id),
  order_number text,
  decline_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE INDEX IF NOT EXISTS payment_intents_customer_ref_idx ON payment_intents (customer_ref);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_last4 text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_brand text;
