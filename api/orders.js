import { requireAdmin } from './_lib/auth.js';
import { ensureSchema, getSql, normalizeOrder } from './_lib/db.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

async function enrichOrderItems(db, rows) {
  const orders = rows.map(normalizeOrder);
  const productIds = [...new Set(
    orders.flatMap((order) =>
      (order.items || [])
        .map((item) => String(item.id || '').trim())
        .filter(Boolean)
    )
  )];

  if (productIds.length === 0) return orders;

  const products = await db`
    SELECT id::text AS id, image_url
    FROM products
    WHERE id::text IN (
      SELECT value FROM jsonb_array_elements_text(${JSON.stringify(productIds)}::jsonb)
    )
  `;
  const imagesById = new Map(products.map((product) => [String(product.id), product.image_url || '']));

  return orders.map((order) => ({
    ...order,
    items: (order.items || []).map((item) => ({
      ...item,
      image_url: item.image_url || imagesById.get(String(item.id || '')) || '',
    })),
  }));
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'POST') {
      const body = await readJson(req);
      const customerName = String(body.customer_name || '').trim();
      const customerPhone = String(body.customer_phone || '').trim();
      const total = Number(body.total || 0);
      const items = Array.isArray(body.items) ? body.items : [];
      if (!customerName || !customerPhone || !items.length || !total) {
        return sendError(res, 400, 'Order details are incomplete');
      }

      const [row] = await db`
        INSERT INTO orders (customer_name, customer_phone, items, total, status, note)
        VALUES (
          ${customerName},
          ${customerPhone},
          ${JSON.stringify(items)}::jsonb,
          ${total},
          ${body.status ? String(body.status) : 'pending'},
          ${body.note ? String(body.note) : ''}
        )
        RETURNING *
      `;
      return sendJson(res, 201, normalizeOrder(row));
    }

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const phone = String(url.searchParams.get('phone') || '').replace(/\D/g, '');
      const id = String(url.searchParams.get('id') || '').trim();
      if (phone) {
        const lastDigits = phone.slice(-9);
        const rows = id
          ? await db`
              SELECT * FROM orders
              WHERE customer_phone ILIKE ${`%${lastDigits}%`}
                AND id::text LIKE ${`${id}%`}
              ORDER BY created_at DESC
              LIMIT 5
            `
          : await db`
              SELECT * FROM orders
              WHERE customer_phone ILIKE ${`%${lastDigits}%`}
              ORDER BY created_at DESC
              LIMIT 5
            `;
        return sendJson(res, 200, await enrichOrderItems(db, rows));
      }
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'GET') {
      const rows = await db`SELECT * FROM orders ORDER BY created_at DESC`;
      return sendJson(res, 200, await enrichOrderItems(db, rows));
    }

    if (req.method === 'PUT') {
      const body = await readJson(req);
      const id = String(body.id || '').trim();
      const status = String(body.status || '').trim();
      if (!id || !status) return sendError(res, 400, 'Order id and status are required');

      const [row] = await db`
        UPDATE orders
        SET status = ${status}
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return sendError(res, 404, 'Order not found');
      return sendJson(res, 200, normalizeOrder(row));
    }

    if (req.method === 'DELETE') {
      const { id } = await readJson(req);
      if (!id) return sendError(res, 400, 'Order id is required');
      await db`DELETE FROM orders WHERE id = ${String(id)}`;
      return sendJson(res, 200, { ok: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Order request failed');
  }
}
