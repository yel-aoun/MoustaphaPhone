import { useState, useEffect, useCallback } from 'react';
import { storagePrefix } from '@/lib/brand';

const WISHLIST_KEY = `${storagePrefix}_wishlist`;

function getWishlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('wishlist-updated'));
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(getWishlist);

  useEffect(() => {
    const handler = () => setWishlist(getWishlist());
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, []);

  const toggleWishlist = useCallback((product) => {
    const current = getWishlist();
    const exists = current.find((i) => i.id === product.id);
    if (exists) {
      saveWishlist(current.filter((i) => i.id !== product.id));
    } else {
      saveWishlist([...current, product]);
    }
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    saveWishlist(getWishlist().filter((i) => i.id !== productId));
  }, []);

  return {
    wishlist,
    toggleWishlist,
    removeFromWishlist,
    totalWishlist: wishlist.length,
  };
}
