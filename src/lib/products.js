export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getProductPath(product) {
  const base = slugify(product?.name) || 'produit';
  const suffix = product?.id ? `-${String(product.id).slice(0, 8)}` : '';
  return `/product/${base}${suffix}`;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function getSiteOrigin() {
  const configured =
    import.meta.env?.VITE_SITE_URL ||
    import.meta.env?.VITE_PUBLIC_SITE_URL ||
    import.meta.env?.VITE_APP_URL;

  if (configured) {
    const clean = String(configured).trim().replace(/\/+$/, '');
    if (clean) {
      const hasProtocol = /^https?:\/\//i.test(clean);
      const isLocal = clean.includes('localhost') || clean.startsWith('127.0.0.1') || clean.startsWith('0.0.0.0');
      return `${hasProtocol ? '' : isLocal ? 'http://' : 'https://'}${clean}`;
    }
  }

  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function toPublicUrl(value) {
  const siteOrigin = getSiteOrigin();
  if (!value) return '';

  try {
    const url = new URL(value, siteOrigin || undefined);
    const siteUrl = siteOrigin ? new URL(siteOrigin) : null;
    if (siteUrl && LOCAL_HOSTS.has(url.hostname)) {
      return `${siteUrl.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return url.href;
  } catch {
    if (String(value).startsWith('/') && siteOrigin) return `${siteOrigin}${value}`;
    return String(value);
  }
}

export function getProductUrl(product) {
  return toPublicUrl(getProductPath(product));
}

export function productMatchesSlug(product, slug) {
  if (!product || !slug) return false;
  return slug === getProductPath(product).split('/').pop() || slug === slugify(product.name);
}

export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-MA')} MAD`;
}
