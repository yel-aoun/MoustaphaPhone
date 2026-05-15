import { ensureSchema, getSql, normalizeProduct } from './_lib/db.js';
import { sendText } from './_lib/http.js';
import { getSiteUrl } from './_lib/site.js';
import { productPath } from './_lib/slug.js';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendText(res, 405, 'Method not allowed');
  }

  const siteUrl = getSiteUrl(req);
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/admin', priority: '0.1', changefreq: 'monthly' },
  ];

  try {
    await ensureSchema();
    const db = getSql();
    const rows = await db`SELECT * FROM products WHERE status <> 'inactive' ORDER BY created_date DESC`;
    for (const product of rows.map(normalizeProduct)) {
      urls.push({
        loc: productPath(product),
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: product.created_date ? new Date(product.created_date).toISOString() : undefined,
      });
    }
  } catch {
    // Keep the sitemap useful even if production data is temporarily unavailable.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(`${siteUrl}${url.loc}`)}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.lastmod ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

  return sendText(res, 200, body, 'application/xml; charset=utf-8');
}
