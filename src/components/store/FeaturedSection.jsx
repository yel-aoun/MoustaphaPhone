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
    <section className="mb-12">
      {/* Header row */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-extrabold tracking-normal text-foreground">{title}</h2>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="mb-0.5 flex items-center gap-0.5 text-xs font-semibold text-primary transition-colors hover:underline underline-offset-2"
              >
                Voir tout
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="hidden gap-1.5 shrink-0 sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary"
            aria-label="Faire defiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary"
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
          className="flex snap-x items-stretch gap-3 overflow-x-auto pb-2 sm:gap-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
        <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
