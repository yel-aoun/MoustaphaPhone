import { categoryLabel } from '@/lib/productCategories';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';
import { slugify } from '@/lib/products';

const PAGE_SIZE = 12;
const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4';

export default function ProductGrid({
  products,
  onAddToCart,
  isLoading,
  onReset,
  suggestedCategories = [],
}) {
  const [page, setPage] = useState(1);

  // Reset pagination whenever the product list changes (filter, search, sort, category)
  useEffect(() => {
    setPage(1);
  }, [products]);

  const visibleCount = page * PAGE_SIZE;
  const visible = products.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  if (isLoading) {
    return (
      <div className={GRID_CLASS}>
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/5] rounded-2xl bg-secondary" />
            <div className="mt-3 h-3.5 w-4/5 rounded bg-secondary" />
            <div className="mt-2 h-3.5 w-1/3 rounded bg-secondary" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-secondary px-6 py-16 text-center">
        <PackageOpen className="mb-4 h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="text-lg font-semibold text-foreground">Aucun produit trouvé</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Essayez une autre recherche ou retirez quelques filtres.</p>
        {suggestedCategories.length > 0 && (
          <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
            {suggestedCategories.slice(0, 6).map((category) => (
              <Link
                key={categoryLabel(category.name)}
                to={`/category/${slugify(category.name)}`}
                className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                {categoryLabel(category.name)}
              </Link>
            ))}
          </div>
        )}
        {onReset && (
          <button
            onClick={() => { onReset(); setPage(1); }}
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={GRID_CLASS}>
        {visible.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            imagePriority={index < 4}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {visible.length} sur {products.length} produits
          </p>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="h-11 rounded-full border border-foreground px-7 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Afficher plus
          </button>
        </div>
      )}
    </div>
  );
}
