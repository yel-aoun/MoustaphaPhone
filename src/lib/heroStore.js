import { useState, useEffect } from 'react';
import { storagePrefix } from '@/lib/brand';

const KEY = `${storagePrefix}_hero_config`;
const OLD_DEFAULT_TITLES = ['Découvrez la tech de demain.', 'Logitech Essentials pour votre bureau.'];
const OLD_DEFAULT_SUBTITLES = [
  'Des produits soigneusement sélectionnés, livrés rapidement, avec une expérience simple et élégante.',
  'Souris, claviers et casques fiables, avec livraison partout au Maroc et paiement à la livraison.',
];

export const DEFAULT_HERO_CONFIG = {
  defaultTitle: 'La tech de 2026, livrée chez vous.',
  defaultSubtitle: 'Smartphones, coques et accessoires originaux, avec livraison partout au Maroc et paiement à la livraison.',
  slides: [], // [{ productId }]
};

export function getHeroConfig() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_HERO_CONFIG;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_HERO_CONFIG, ...parsed };
    if (!Array.isArray(merged.slides)) merged.slides = [];

    if (OLD_DEFAULT_TITLES.includes(parsed.defaultTitle)) {
      merged.defaultTitle = DEFAULT_HERO_CONFIG.defaultTitle;
    }
    if (OLD_DEFAULT_SUBTITLES.includes(parsed.defaultSubtitle)) {
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
