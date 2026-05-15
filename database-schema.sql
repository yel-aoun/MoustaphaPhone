-- Client store database schema for Neon/Postgres.
-- The API routes also create this schema automatically on first request.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  price           NUMERIC     NOT NULL,
  original_price  NUMERIC,
  category        TEXT,
  status          TEXT        DEFAULT 'active',
  image_url       TEXT        DEFAULT '',
  extra_images    TEXT[]      DEFAULT '{}',
  description     TEXT        DEFAULT '',
  colors          JSONB       DEFAULT '[]',
  specs           JSONB       DEFAULT '[]',
  badges          JSONB       DEFAULT '[]',
  created_date    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name   TEXT        NOT NULL,
  customer_phone  TEXT        NOT NULL,
  items           JSONB       NOT NULL DEFAULT '[]',
  total           NUMERIC     NOT NULL,
  status          TEXT        DEFAULT 'pending',
  note            TEXT        DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        UNIQUE NOT NULL,
  icon        TEXT        DEFAULT 'Tag',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, icon) VALUES
  ('Audio', 'Headphones'),
  ('Wearables', 'Watch'),
  ('Displays', 'Monitor'),
  ('Peripherals', 'Mouse'),
  ('Phones', 'Smartphone'),
  ('Accessories', 'Cable')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS analytics_events (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type      TEXT        NOT NULL,
  product_id      TEXT,
  product_name    TEXT,
  search_query    TEXT,
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_product_created_idx ON analytics_events (product_id, created_at DESC);
