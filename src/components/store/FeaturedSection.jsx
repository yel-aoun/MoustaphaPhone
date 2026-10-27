import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FeaturedSection({ title, subtitle, products, onAddToCart, onQuickView, onViewAll }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="mb-14">
      {/* Header row */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          {subtitle && (
            <p className="section-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {subtitle}
            </p>
          )}
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="mr-1 flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => scroll(-1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary sm:flex"
            aria-label="Faire defiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-secondary sm:flex"
            aria-label="Faire defiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x items-stretch gap-3 overflow-x-auto pb-3 pt-1 sm:gap-4"
        >
          {products.map((product) => (
            <div key={product.id} className="w-48 shrink-0 snap-start sm:w-56 md:w-60">
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            </div>
          ))}
        </div>
        {/* Right-edge fade hint */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-3 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
