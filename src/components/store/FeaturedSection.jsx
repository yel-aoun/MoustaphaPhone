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
          <Link to={viewAllTo} className="-my-2 flex min-h-10 shrink-0 items-center text-sm font-medium text-primary hover:underline">
            Tout voir <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </Reveal>
      {/* One reveal for the whole row: per-card reveals left the peeking card invisible on phones */}
      <Reveal className="product-rail sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {products.slice(0, 8).map((product, index) => (
          <div key={product.id} className="sm:w-auto sm:max-w-none">
            <ProductCard product={product} onAddToCart={onAddToCart} imagePriority={index < 2} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
