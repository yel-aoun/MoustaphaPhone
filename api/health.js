import { ensureSchema, getSql } from './_lib/db.js';
import { sendJson } from './_lib/http.js';

const REQUIRED_ENV = [
  'DATABASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SITE_URL',
  'VITE_SITE_URL',
  'VITE_STORE_NAME',
  'VITE_WHATSAPP_NUMBER',
];

function configured(name) {
  return Boolean(String(process.env[name] || '').trim());
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const env = Object.fromEntries(REQUIRED_ENV.map((name) => [name, configured(name)]));
  const missing = REQUIRED_ENV.filter((name) => !env[name]);
  const checks = {
    env,
    missing,
    database: {
      connected: false,
      products: null,
      categories: null,
      orders: null,
    },
  };

  if (!env.DATABASE_URL) {
    return sendJson(res, 503, {
      ok: false,
      checks,
      message: 'DATABASE_URL is missing in this environment',
    });
  }

  try {
    await ensureSchema();
    const db = getSql();
    const [products] = await db`SELECT COUNT(*)::int AS count FROM products`;
    const [categories] = await db`SELECT COUNT(*)::int AS count FROM categories`;
    const [orders] = await db`SELECT COUNT(*)::int AS count FROM orders`;

    checks.database = {
      connected: true,
      products: products.count,
      categories: categories.count,
      orders: orders.count,
    };

    const ok = missing.length === 0 && checks.database.connected;
    return sendJson(res, ok ? 200 : 503, {
      ok,
      checks,
      message: ok ? 'Production checks passed' : 'Some production environment variables are missing',
    });
  } catch (error) {
    checks.database.error = error.message || 'Database check failed';
    return sendJson(res, 503, {
      ok: false,
      checks,
      message: 'Database check failed',
    });
  }
}
