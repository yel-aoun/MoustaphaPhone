import { requireAdmin } from './_lib/auth.js';
import { ensureSchema, getSql, normalizeProduct, sanitizeProduct } from './_lib/db.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'GET') {
      const rows = await db`SELECT * FROM products ORDER BY created_date DESC`;
      return sendJson(res, 200, rows.map(normalizeProduct));
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'POST') {
      const product = sanitizeProduct(await readJson(req));
      if (!product.name || !product.price) return sendError(res, 400, 'Product name and price are required');

      const [row] = await db`
        INSERT INTO products (
          name, price, original_price, category, status, image_url, extra_images, description, colors, specs, badges
        )
        VALUES (
          ${product.name}, ${product.price}, ${product.original_price}, ${product.category},
          ${product.status}, ${product.image_url}, ${product.extra_images}, ${product.description},
          ${JSON.stringify(product.colors)}::jsonb, ${JSON.stringify(product.specs)}::jsonb,
          ${JSON.stringify(product.badges)}::jsonb
        )
        RETURNING *
      `;
      return sendJson(res, 201, normalizeProduct(row));
    }

    if (req.method === 'PUT') {
      const body = await readJson(req);
      const id = String(body.id || '').trim();
      const product = sanitizeProduct(body.data || body);
      if (!id) return sendError(res, 400, 'Product id is required');
      if (!product.name || !product.price) return sendError(res, 400, 'Product name and price are required');

      const [row] = await db`
        UPDATE products
        SET
          name = ${product.name},
          price = ${product.price},
          original_price = ${product.original_price},
          category = ${product.category},
          status = ${product.status},
          image_url = ${product.image_url},
          extra_images = ${product.extra_images},
          description = ${product.description},
          colors = ${JSON.stringify(product.colors)}::jsonb,
          specs = ${JSON.stringify(product.specs)}::jsonb,
          badges = ${JSON.stringify(product.badges)}::jsonb
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return sendError(res, 404, 'Product not found');
      return sendJson(res, 200, normalizeProduct(row));
    }

    if (req.method === 'DELETE') {
      const { id } = await readJson(req);
      if (!id) return sendError(res, 400, 'Product id is required');
      await db`DELETE FROM products WHERE id = ${String(id)}`;
      return sendJson(res, 200, { ok: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Product request failed');
  }
}
