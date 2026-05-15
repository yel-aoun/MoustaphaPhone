export function getSiteUrl(req) {
  const configured =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (configured) {
    const isLocalConfigured = configured.includes('localhost') || configured.startsWith('127.0.0.1');
    const withProtocol = configured.startsWith('http')
      ? configured
      : `${isLocalConfigured ? 'http' : 'https'}://${configured}`;
    return withProtocol.replace(/\/+$/, '');
  }

  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (!host) return 'http://localhost:5173';

  const localHost = String(host).includes('localhost') || String(host).startsWith('127.0.0.1');
  const proto = localHost ? 'http' : (req?.headers?.['x-forwarded-proto'] || 'https');
  return `${proto}://${host}`.replace(/\/+$/, '');
}
