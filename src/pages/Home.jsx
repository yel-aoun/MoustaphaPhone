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
import TrustBadges from '@/components/store/TrustBadges';
import RecentlyViewedSection from '@/components/store/RecentlyViewedSection';

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

  const heroProducts = useMemo(() => {
    const seen = new Set();
    return [...onSale, ...newest, ...activeProducts].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 5);
  }, [onSale, newest, activeProducts]);

  return (
    <StoreLayout>
      <HeroSlider products={heroProducts} heroConfig={heroConfig} />

      {isError && (
        <div className="container-store pt-6">
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Impossible de charger le catalogue : {error?.message || 'erreur API'}.
          </div>
        </div>
      )}

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
          <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-12 sm:py-14">
            <p className="text-sm font-medium opacity-80">Offres du moment</p>
            <h2 className="mt-2 max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
              Jusqu'à −{Math.max(...onSale.map((p) => Math.round(((p.original_price - p.price) / p.original_price) * 100)))}% sur une sélection.
            </h2>
            <Link
              to="/boutique?sale=1"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-primary-foreground px-6 text-sm font-medium text-primary transition-opacity hover:opacity-90"
            >
              Voir les offres
            </Link>
          </div>
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

      <BrandStrip products={activeProducts} />

      <div className="container-store">
        <RecentlyViewedSection products={activeProducts} onAddToCart={addToCart} />
      </div>

      <TrustBadges />
    </StoreLayout>
  );
}
