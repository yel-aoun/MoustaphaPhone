import { requireAdmin } from './_lib/auth.js';
import { ensureSchema, getSql } from './_lib/db.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

const SETTINGS_KEY = 'hero_config';

function sanitizeHeroConfig(input) {
  return {
    defaultTitle: String(input.defaultTitle || '').trim().slice(0, 200),
    defaultSubtitle: String(input.defaultSubtitle || '').trim().slice(0, 400),
    slides: Array.isArray(input.slides)
      ? input.slides
          .map((slide) => ({ productId: String(slide?.productId || '').trim() }))
          .filter((slide) => slide.productId)
          .slice(0, 5)
      : [],
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'GET') {
      const [row] = await db`SELECT value FROM site_settings WHERE key = ${SETTINGS_KEY}`;
      return sendJson(res, 200, row?.value || null);
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'PUT') {
      const config = sanitizeHeroConfig(await readJson(req));
      await db`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES (${SETTINGS_KEY}, ${JSON.stringify(config)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      return sendJson(res, 200, config);
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Hero config request failed');
  }
}
