import { storagePrefix } from '@/lib/brand';

export const RECENT_UPDATED_EVENT = 'client-store-recent-updated';

const RECENT_KEY = `${storagePrefix}_recent_products`;
const LIMIT = 8;

export function addRecentlyViewed(product) {
  if (!product?.id) return;
  try {
    const current = getRecentlyViewedIds();
    const next = [product.id, ...current.filter((id) => id !== product.id)].slice(0, LIMIT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_UPDATED_EVENT));
  } catch {
    localStorage.removeItem(RECENT_KEY);
  }
}

export function getRecentlyViewedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}
