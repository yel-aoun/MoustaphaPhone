import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { PackageOpen, RotateCcw, Search } from 'lucide-react';
import { cloudinaryImage } from '@/lib/images';
import { getProductPath } from '@/lib/products';

const PAGE_SIZE = 12;
const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5';

export default function ProductGrid({
  products,
  onAddToCart,
  onQuickView,
  isLoading,
  onReset,
  suggestedCategories = [],
  onCategorySelect,
  popularProducts = [],
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
        {Array(PAGE_SIZE).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-square bg-surface" />
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="h-2.5 bg-secondary rounded w-1/3" />
                <div className="h-4 bg-secondary rounded-full w-12" />
              </div>
              <div className="h-3.5 bg-secondary rounded w-5/6" />
              <div className="h-3.5 bg-secondary rounded w-2/3" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="grid grid-cols-[1fr_2.25rem] gap-2 pt-1">
                <div className="h-8 bg-secondary rounded-lg" />
                <div className="h-8 bg-secondary rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-4 py-16 text-center text-muted-foreground">
        <PackageOpen className="w-14 h-14 mb-4 opacity-25" />
        <p className="text-base font-semibold text-foreground">Aucun produit trouvé</p>
        <p className="text-sm mt-1 mb-6">Essayez une autre recherche, catégorie ou fourchette de prix.</p>
        {suggestedCategories.length > 0 && (
          <div className="mb-6 flex max-w-xl flex-wrap justify-center gap-2">
            {suggestedCategories.slice(0, 6).map((category) => (
              <button
                key={category.name || category}
                type="button"
                onClick={() => onCategorySelect?.(category.name || category)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Search className="h-3 w-3" />
                {category.name || category}
              </button>
            ))}
          </div>
        )}
        {onReset && (
          <button
            onClick={() => { onReset(); setPage(1); }}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser les filtres
          </button>
        )}
        {popularProducts.length > 0 && (
          <div className="mt-8 w-full max-w-2xl border-t border-border pt-5 text-left">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Produits populaires
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {popularProducts.slice(0, 3).map((product) => (
                <Link
                  key={product.id}
                  to={getProductPath(product)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 transition-colors hover:border-primary/35"
                >
                  {product.image_url ? (
                    <img
                      src={cloudinaryImage(product.image_url)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-10 w-10 shrink-0 rounded-md bg-white object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <PackageOpen className="h-4 w-4 opacity-40" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">{product.name}</span>
                    <span className="font-mono text-xs text-primary">{product.price?.toLocaleString('fr-MA')} MAD</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
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
            onQuickView={onQuickView}
            imagePriority={index < 6}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 mt-10">
          <p className="text-xs text-muted-foreground">
            {visible.length} / {products.length} produits affichés
          </p>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-background px-6 py-2.5 text-sm font-semibold text-primary transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
          >
            Charger plus
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold">
              +{Math.min(PAGE_SIZE, products.length - visibleCount)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
