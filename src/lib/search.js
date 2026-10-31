import { categoryLabel } from '@/lib/productCategories';
import { storagePrefix } from '@/lib/brand';

const RECENT_KEY = `${storagePrefix}_recent_searches`;

// Lowercase and strip accents so "ecouteurs" matches "Écouteurs"
export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function productMatchesQuery(product, query) {
  const q = normalizeText(query);
  if (!q) return true;
  const haystack = normalizeText(`${product.name} ${product.category} ${categoryLabel(product.category)} ${product.description}`);
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function getRecentSearches() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query) {
  const value = String(query || '').trim();
  if (value.length < 2) return;
  try {
    const next = [value, ...getRecentSearches().filter((item) => normalizeText(item) !== normalizeText(value))].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — recent searches are a convenience only
  }
}

export function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
}
