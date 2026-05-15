const env = import.meta.env || {};

const trim = (value) => String(value || '').trim();

function slugify(value) {
  return trim(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'client-store';
}

export function normalizePhone(value) {
  return trim(value).replace(/\D/g, '');
}

export function formatPhone(value) {
  const digits = normalizePhone(value);
  if (!digits) return 'WhatsApp';
  if (digits.startsWith('212') && digits.length === 12) {
    return `+212 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

const name = trim(env.VITE_STORE_NAME) || 'Client Store';

export const storeBrand = {
  name,
  slug: slugify(env.VITE_STORE_SLUG || name),
  tagline: trim(env.VITE_STORE_TAGLINE) || 'Boutique tech au Maroc',
  description:
    trim(env.VITE_STORE_DESCRIPTION) ||
    'Accessoires, périphériques et produits tech avec livraison partout au Maroc.',
  whatsappNumber: normalizePhone(env.VITE_WHATSAPP_NUMBER),
  whatsappDisplay: trim(env.VITE_WHATSAPP_DISPLAY) || formatPhone(env.VITE_WHATSAPP_NUMBER),
  supportHours: trim(env.VITE_SUPPORT_HOURS) || '7j/7 de 9h à 21h',
  siteUrl: trim(env.VITE_SITE_URL).replace(/\/+$/, ''),
};

export const storagePrefix = 'client_store';

export function brandTitle(title) {
  const value = trim(title);
  if (!value) return `${storeBrand.name} - ${storeBrand.tagline}`;
  return value.includes(storeBrand.name) ? value : `${value} | ${storeBrand.name}`;
}

export function buildWhatsAppLink(message = '') {
  if (!storeBrand.whatsappNumber) return '#';
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${storeBrand.whatsappNumber}${query}`;
}
