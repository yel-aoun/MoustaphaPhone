import { requireAdmin } from './_lib/auth.js';
import { ensureSchema, getSql } from './_lib/db.js';
import { handleOptions, readJson, sendError, sendJson } from './_lib/http.js';

function sanitizeCategory(input) {
  return {
    name: String(input.name || '').trim(),
    icon: input.icon ? String(input.icon) : 'Tag',
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    await ensureSchema();
    const db = getSql();

    if (req.method === 'GET') {
      const rows = await db`SELECT * FROM categories ORDER BY name`;
      return sendJson(res, 200, rows);
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'POST') {
      const category = sanitizeCategory(await readJson(req));
      if (!category.name) return sendError(res, 400, 'Category name is required');
      const [row] = await db`
        INSERT INTO categories (name, icon)
        VALUES (${category.name}, ${category.icon})
        RETURNING *
      `;
      return sendJson(res, 201, row);
    }

    if (req.method === 'PUT') {
      const body = await readJson(req);
      const oldName = String(body.oldName || '').trim();
      const category = sanitizeCategory(body);
      if (!oldName || !category.name) return sendError(res, 400, 'Category names are required');

      const [row] = await db`
        UPDATE categories
        SET name = ${category.name}, icon = ${category.icon}
        WHERE name = ${oldName}
        RETURNING *
      `;
      if (!row) return sendError(res, 404, 'Category not found');
      if (oldName !== category.name) {
        await db`UPDATE products SET category = ${category.name} WHERE category = ${oldName}`;
      }
      return sendJson(res, 200, row);
    }

    if (req.method === 'DELETE') {
      const { name } = await readJson(req);
      if (!name) return sendError(res, 400, 'Category name is required');
      await db`DELETE FROM categories WHERE name = ${String(name)}`;
      return sendJson(res, 200, { ok: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    const message = error.code === '23505' ? 'Cette catégorie existe déjà' : error.message;
    return sendError(res, error.statusCode || 500, message || 'Category request failed');
  }
}
