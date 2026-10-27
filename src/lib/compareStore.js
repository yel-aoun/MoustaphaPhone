import { useCallback, useEffect, useState } from 'react';
import { storagePrefix } from '@/lib/brand';

const COMPARE_KEY = `${storagePrefix}_compare`;
const COMPARE_EVENT = 'client-store-compare-updated';
const MAX_COMPARE = 3;

function readCompare() {
  try {
    const stored = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeCompare(ids) {
  const next = ids.slice(0, MAX_COMPARE);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(COMPARE_EVENT));
}

export function useCompare() {
  const [ids, setIds] = useState(readCompare);

  useEffect(() => {
    const handler = () => setIds(readCompare());
    window.addEventListener(COMPARE_EVENT, handler);
    return () => window.removeEventListener(COMPARE_EVENT, handler);
  }, []);

  const toggleCompare = useCallback((product) => {
    if (!product?.id) return;
    const current = readCompare();
    const next = current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [product.id, ...current].slice(0, MAX_COMPARE);
    writeCompare(next);
  }, []);

  const clearCompare = useCallback(() => writeCompare([]), []);
  const removeCompare = useCallback((id) => writeCompare(readCompare().filter((item) => item !== id)), []);

  return { compareIds: ids, toggleCompare, clearCompare, removeCompare, maxCompare: MAX_COMPARE };
}
