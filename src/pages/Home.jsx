import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cartStore';
import { useHeroConfig } from '@/lib/heroStore';
import { useSeo } from '@/lib/seo';
import { storeBrand } from '@/lib/brand';
import StoreLayout, { useStoreProducts } from '@/components/store/StoreLayout';
import HeroSlider from '@/components/store/HeroSlider';
import CategoryShowcase from '@/components/store/CategoryShowcase';
import FeaturedSection from '@/components/store/FeaturedSection';
import BrandStrip from '@/components/store/BrandStrip';
import RecentlyViewedSection from '@/components/store/RecentlyViewedSection';
import HowItWorks from '@/components/store/HowItWorks';
import ExperienceBento from '@/components/store/ExperienceBento';
import TechTicker from '@/components/store/fx/TechTicker';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import Reveal from '@/components/store/fx/Reveal';

export default function Home() {
  const { config: heroConfig } = useHeroConfig();
  const { activeProducts, isError, error } = useStoreProducts();
  const { addToCart } = useCart();

  useSeo({
    title: `${storeBrand.name} - ${storeBrand.tagline}`,
    description: storeBrand.description,
    url: `${window.location.origin}/`,
  });

  const available = useMemo(() => activeProducts.filter((p) => p.status === 'active' || !p.status), [activeProducts]);
  const onSale = useMemo(
    () => available.filter((p) => p.original_price && p.original_price > p.price),
    [available]
  );
  const newest = useMemo(
    () => [...available].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 8),
    [available]
  );

  const maxDiscount = onSale.length
    ? Math.max(...onSale.map((p) => Math.round(((p.original_price - p.price) / p.original_price) * 100)))
    : 0;

  const heroProducts = useMemo(() => {
    const seen = new Set();
    return [...onSale, ...newest, ...activeProducts].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 5);
  }, [onSale, newest, activeProducts]);

  return (
    <StoreLayout overlapHeader>
      <HeroSlider products={heroProducts} heroConfig={heroConfig} totalProducts={activeProducts.length} />
      <TechTicker />

      {isError && (
        <div className="container-store pt-6">
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Impossible de charger le catalogue : {error?.message || 'erreur API'}.
          </div>
        </div>
      )}

      <ExperienceBento products={activeProducts} />

      <CategoryShowcase products={activeProducts} />

      <FeaturedSection
        title="Les nouveautés"
        subtitle="Les derniers arrivages en boutique."
        products={newest}
        onAddToCart={addToCart}
        viewAllTo="/boutique?sort=newest"
      />

      {onSale.length > 0 && (
        <section className="container-store pb-14 sm:pb-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-[hsl(215_45%_10%)] px-6 py-12 text-white sm:px-12 sm:py-16">
              <CircuitBackground className="text-sky-200" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,hsl(200_90%_60%/0.35),transparent_65%)]" />
              <div className="relative max-w-lg">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-100">
                  <span className="h-1.5 w-1.5 animate-blink rounded-full bg-sky-300" />
                  Offres du moment
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                  Jusqu’à −{maxDiscount}%<br className="hidden sm:block" /> sur une sélection.
                </h2>
                <p className="mt-3 text-sm text-white/70 sm:text-base">{onSale.length} produit{onSale.length > 1 ? 's' : ''} en promotion, tant qu’il y a du stock.</p>
                <Link
                  to="/boutique?sale=1"
                  className="mt-7 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-medium text-[hsl(215_45%_10%)] transition-transform hover:-translate-y-0.5"
                >
                  Voir les offres
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {onSale.length > 0 && (
        <FeaturedSection
          title="En promotion"
          products={onSale}
          onAddToCart={addToCart}
          viewAllTo="/boutique?sale=1"
        />
      )}

      <HowItWorks />

      <BrandStrip products={activeProducts} />

      <div className="container-store">
        <RecentlyViewedSection products={activeProducts} onAddToCart={addToCart} />
      </div>

    </StoreLayout>
  );
}
