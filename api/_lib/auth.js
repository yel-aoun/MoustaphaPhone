import crypto from 'node:crypto';
import { readJson, sendError } from './http.js';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(payload) {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET or ADMIN_PASSWORD is missing');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminToken(email) {
  const payload = encode({
    email,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;

  const decoded = decode(payload);
  if (!decoded.exp || decoded.exp < Date.now()) return null;
  return decoded;
}

export function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export function requireAdmin(req, res) {
  const token = getBearerToken(req);
  try {
    const session = verifyAdminToken(token);
    if (session) return session;
  } catch {
    // Fall through to a generic auth error.
  }
  sendError(res, 401, 'Admin authentication required');
  return null;
}

export async function readLogin(req) {
  const body = await readJson(req);
  return {
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || ''),
  };
}
