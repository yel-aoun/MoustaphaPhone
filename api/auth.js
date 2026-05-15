import { createAdminToken, readLogin, requireAdmin } from './_lib/auth.js';
import { handleOptions, sendError, sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'POST') {
      const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const adminPassword = String(process.env.ADMIN_PASSWORD || '');
      if (!adminEmail || !adminPassword) {
        return sendError(res, 500, 'ADMIN_EMAIL and ADMIN_PASSWORD are required');
      }

      const { email, password } = await readLogin(req);
      if (email !== adminEmail || password !== adminPassword) {
        return sendError(res, 401, 'Invalid credentials');
      }

      return sendJson(res, 200, {
        token: createAdminToken(email),
        user: { email },
      });
    }

    if (req.method === 'GET') {
      const session = requireAdmin(req, res);
      if (!session) return;
      return sendJson(res, 200, { user: { email: session.email } });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Authentication failed');
  }
}
