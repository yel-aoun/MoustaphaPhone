import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import Reveal from '@/components/store/fx/Reveal';

export default function FeaturedSection({ title, subtitle, products, onAddToCart, viewAllTo }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="container-store pb-14 sm:pb-20">
      <Reveal className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="flex shrink-0 items-center text-sm font-medium text-primary hover:underline">
            Tout voir <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </Reveal>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.slice(0, 8).map((product, index) => (
          <Reveal key={product.id} delay={Math.min(index, 4) * 0.06} className="w-[46vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <ProductCard product={product} onAddToCart={onAddToCart} imagePriority={index < 2} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
