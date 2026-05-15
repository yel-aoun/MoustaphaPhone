import { useState, useEffect } from 'react';
import { storagePrefix } from '@/lib/brand';

const KEY = `${storagePrefix}_hero_config`;
const OLD_DEFAULT_TITLE = 'Découvrez la tech de demain.';
const OLD_DEFAULT_SUBTITLE = 'Des produits soigneusement sélectionnés, livrés rapidement, avec une expérience simple et élégante.';

export const DEFAULT_HERO_CONFIG = {
  defaultTitle: 'Logitech Essentials pour votre bureau.',
  defaultSubtitle: 'Souris, claviers et casques fiables, avec livraison partout au Maroc et paiement à la livraison.',
  slides: [], // [{ productId }]
};

export function getHeroConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HERO_CONFIG;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_HERO_CONFIG, ...parsed };

    if (parsed.defaultTitle === OLD_DEFAULT_TITLE) {
      merged.defaultTitle = DEFAULT_HERO_CONFIG.defaultTitle;
    }
    if (parsed.defaultSubtitle === OLD_DEFAULT_SUBTITLE) {
      merged.defaultSubtitle = DEFAULT_HERO_CONFIG.defaultSubtitle;
    }

    return merged;
  } catch {
    return DEFAULT_HERO_CONFIG;
  }
}

export function saveHeroConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function useHeroConfig() {
  const [config, setConfig] = useState(getHeroConfig);

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY) setConfig(getHeroConfig());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const save = (newConfig) => {
    saveHeroConfig(newConfig);
    setConfig(newConfig);
  };

  return { config, save };
}
