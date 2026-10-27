import { useQuery, useQueryClient } from '@tanstack/react-query';
import { heroConfigStore } from '@/api/base44Client';
import { storagePrefix } from '@/lib/brand';

const LEGACY_LOCAL_KEYS = [`${storagePrefix}_hero_config`, 'client_store_hero_config'];
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

function normalizeHeroConfig(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_HERO_CONFIG;
  const merged = { ...DEFAULT_HERO_CONFIG, ...raw };

  if (!merged.defaultTitle || OLD_DEFAULT_TITLES.includes(raw.defaultTitle)) {
    merged.defaultTitle = DEFAULT_HERO_CONFIG.defaultTitle;
  }
  if (!merged.defaultSubtitle || OLD_DEFAULT_SUBTITLES.includes(raw.defaultSubtitle)) {
    merged.defaultSubtitle = DEFAULT_HERO_CONFIG.defaultSubtitle;
  }
  merged.slides = Array.isArray(merged.slides) ? merged.slides : [];

  return merged;
}

// Hero picks used to live only in the admin's own browser, so visitors never saw them.
// Surface any leftover local config once so AdminHeroManager can push it to the server.
export function readLegacyLocalHeroConfig() {
  for (const key of LEGACY_LOCAL_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.slides?.length > 0) return normalizeHeroConfig(parsed);
    } catch {
      // ignore malformed legacy entries
    }
  }
  return null;
}

export function clearLegacyLocalHeroConfig() {
  for (const key of LEGACY_LOCAL_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
}

export function useHeroConfig() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['hero-config'],
    queryFn: async () => normalizeHeroConfig(await heroConfigStore.get()),
    staleTime: 60 * 1000,
  });

  const save = async (newConfig) => {
    const saved = normalizeHeroConfig(await heroConfigStore.save(newConfig));
    queryClient.setQueryData(['hero-config'], saved);
    return saved;
  };

  return { config: data || DEFAULT_HERO_CONFIG, save, isLoading };
}
