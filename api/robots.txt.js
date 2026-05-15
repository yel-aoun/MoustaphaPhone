import { sendText } from './_lib/http.js';
import { getSiteUrl } from './_lib/site.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return sendText(res, 405, 'Method not allowed');
  }

  const siteUrl = getSiteUrl(req);
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`;

  return sendText(res, 200, body);
}
