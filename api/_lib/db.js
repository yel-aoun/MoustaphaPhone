import { neon } from '@neondatabase/serverless';

const DEFAULT_CATEGORIES = [
  { name: 'Audio', icon: 'Headphones' },
  { name: 'Wearables', icon: 'Watch' },
  { name: 'Displays', icon: 'Monitor' },
  { name: 'Peripherals', icon: 'Mouse' },
  { name: 'Phones', icon: 'Smartphone' },
  { name: 'Accessories', icon: 'Cable' },
];

let sql;
let schemaReady;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}

export async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const db = getSql();
    await db`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    await db`
      CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        category TEXT,
        status TEXT DEFAULT 'active',
        image_url TEXT DEFAULT '',
        extra_images TEXT[] DEFAULT '{}',
        description TEXT DEFAULT '',
        colors JSONB DEFAULT '[]',
        specs JSONB DEFAULT '[]',
        badges JSONB DEFAULT '[]',
        created_date TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '[]'`;
    await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'`;
    await db`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        total NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        note TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await db`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT 'Tag',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await db`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_type TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT,
        search_query TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await db`CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events (event_type, created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS analytics_events_product_created_idx ON analytics_events (product_id, created_at DESC)`;

    const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM categories`;
    if (count === 0) {
      for (const category of DEFAULT_CATEGORIES) {
        await db`
          INSERT INTO categories (name, icon)
          VALUES (${category.name}, ${category.icon})
          ON CONFLICT (name) DO NOTHING
        `;
      }
    }
  })();

  return schemaReady;
}

function normalizeNumber(value) {
  if (value === null || value === undefined) return value;
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeProduct(row) {
  return {
    ...row,
    price: normalizeNumber(row.price),
    original_price: normalizeNumber(row.original_price),
    extra_images: Array.isArray(row.extra_images) ? row.extra_images : [],
    colors: normalizeJsonArray(row.colors),
    specs: normalizeJsonArray(row.specs),
    badges: normalizeJsonArray(row.badges),
  };
}

export function normalizeOrder(row) {
  return {
    ...row,
    total: normalizeNumber(row.total),
    items: normalizeJsonArray(row.items),
  };
}

export function sanitizeProduct(input) {
  return {
    name: String(input.name || '').trim(),
    price: Number(input.price || 0),
    original_price: input.original_price === null || input.original_price === ''
      ? null
      : Number(input.original_price),
    category: input.category ? String(input.category) : null,
    status: input.status ? String(input.status) : 'active',
    image_url: input.image_url ? String(input.image_url) : '',
    extra_images: Array.isArray(input.extra_images) ? input.extra_images.map(String) : [],
    description: input.description ? String(input.description) : '',
    colors: Array.isArray(input.colors) ? input.colors : [],
    specs: Array.isArray(input.specs)
      ? input.specs
          .map((spec) => ({
            name: String(spec.name || spec.key || '').trim(),
            value: String(spec.value || '').trim(),
          }))
          .filter((spec) => spec.name && spec.value)
      : [],
    badges: Array.isArray(input.badges)
      ? input.badges.map((badge) => String(badge).trim()).filter(Boolean).slice(0, 4)
      : [],
  };
}
