import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';

export default function FeaturedSection({ title, subtitle, products, onAddToCart, onQuickView, onViewAll, highlight = false }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className={`mb-10 ${highlight ? '-mx-4 bg-primary px-4 py-5 sm:mx-0 sm:rounded-2xl sm:px-5' : ''}`}>
      {/* Header row */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          {highlight ? (
            <h2 className="text-xl font-extrabold text-primary-foreground sm:text-2xl">{title}</h2>
          ) : (
            <h2 className="section-title">{title}</h2>
          )}
          {subtitle && (
            <p className={`mt-1 text-sm ${highlight ? 'text-primary-foreground/80' : 'pl-4 text-muted-foreground'}`}>{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className={`mr-1 flex items-center gap-1 text-sm font-bold hover:underline underline-offset-4 ${
                highlight ? 'text-primary-foreground' : 'text-primary'
              }`}
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => scroll(-1)}
            className={`hidden h-9 w-9 items-center justify-center rounded-lg border transition-colors sm:flex ${
              highlight ? 'border-white/30 text-primary-foreground hover:bg-white/15' : 'border-border bg-card hover:border-primary hover:text-primary'
            }`}
            aria-label="Faire defiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className={`hidden h-9 w-9 items-center justify-center rounded-lg border transition-colors sm:flex ${
              highlight ? 'border-white/30 text-primary-foreground hover:bg-white/15' : 'border-border bg-card hover:border-primary hover:text-primary'
            }`}
            aria-label="Faire defiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x items-stretch gap-3 overflow-x-auto pb-1"
      >
        {products.map((product) => (
          <div key={product.id} className="w-44 shrink-0 snap-start sm:w-52 md:w-56">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
