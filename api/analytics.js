import { requireAdmin } from './_lib/auth.js';
import { ensureSchema, getSql } from './_lib/db.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'product_view',
  'add_to_cart',
  'wishlist_add',
  'whatsapp_checkout',
  'search',
  'empty_search',
]);

function clampText(value, max = 240) {
  const text = String(value || '').trim();
  return text.length > max ? text.slice(0, max) : text;
}

function sanitizeEvent(input) {
  const eventType = clampText(input.event_type || input.type, 80);
  if (!ALLOWED_EVENTS.has(eventType)) return null;

  const metadata = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
    ? input.metadata
    : {};

  return {
    event_type: eventType,
    product_id: clampText(input.product_id, 120) || null,
    product_name: clampText(input.product_name, 240) || null,
    search_query: clampText(input.search_query, 160) || null,
    metadata,
  };
}

function normalizeEvent(row) {
  return {
    ...row,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'POST') {
      const event = sanitizeEvent(await readJson(req));
      if (!event) return sendError(res, 400, 'Unsupported analytics event');

      await db`
        INSERT INTO analytics_events (event_type, product_id, product_name, search_query, metadata)
        VALUES (
          ${event.event_type},
          ${event.product_id},
          ${event.product_name},
          ${event.search_query},
          ${JSON.stringify(event.metadata)}::jsonb
        )
      `;
      return sendJson(res, 201, { ok: true });
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'GET') {
      const requestUrl = new URL(req.url || '/api/analytics', 'http://localhost');
      const days = Math.min(90, Math.max(1, Number(requestUrl.searchParams.get('days') || 30) || 30));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const totals = await db`
        SELECT event_type, COUNT(*)::int AS count
        FROM analytics_events
        WHERE created_at >= ${since.toISOString()}
        GROUP BY event_type
        ORDER BY count DESC
      `;
      const topProducts = await db`
        SELECT product_id, COALESCE(MAX(product_name), 'Produit') AS product_name, COUNT(*)::int AS count
        FROM analytics_events
        WHERE created_at >= ${since.toISOString()}
          AND product_id IS NOT NULL
          AND event_type IN ('product_view', 'add_to_cart', 'whatsapp_checkout')
        GROUP BY product_id
        ORDER BY count DESC
        LIMIT 8
      `;
      const topSearches = await db`
        SELECT search_query, COUNT(*)::int AS count
        FROM analytics_events
        WHERE created_at >= ${since.toISOString()}
          AND search_query IS NOT NULL
          AND search_query <> ''
          AND event_type IN ('search', 'empty_search')
        GROUP BY search_query
        ORDER BY count DESC
        LIMIT 8
      `;
      const recentEvents = await db`
        SELECT *
        FROM analytics_events
        WHERE created_at >= ${since.toISOString()}
        ORDER BY created_at DESC
        LIMIT 20
      `;

      return sendJson(res, 200, {
        days,
        totals,
        topProducts,
        topSearches,
        recentEvents: recentEvents.map(normalizeEvent),
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Analytics request failed');
  }
}
