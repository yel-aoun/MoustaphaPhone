import { Link } from 'react-router-dom';
import { Circle, Search, Package } from 'lucide-react';
import { cloudinaryImage } from '@/lib/images';
import { formatMoney, getProductPath } from '@/lib/products';

function matches(product, query) {
  const q = query.toLowerCase();
  return (
    product.name?.toLowerCase().includes(q) ||
    product.category?.toLowerCase().includes(q) ||
    product.description?.toLowerCase().includes(q)
  );
}

export default function SearchSuggestions({ query, products = [], onCategorySelect, onSelect }) {
  const clean = query.trim();
  if (clean.length < 2) return null;

  const matchingProducts = products.filter((product) => product.status !== 'inactive' && matches(product, clean)).slice(0, 6);
  const matchingCategories = Array.from(
    new Set(
      products
        .filter((product) => product.category?.toLowerCase().includes(clean.toLowerCase()))
        .map((product) => product.category)
        .filter(Boolean)
    )
  ).slice(0, 4);

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] overflow-hidden rounded-lg border border-border bg-background shadow-xl sm:min-w-[420px]">
      {matchingProducts.length > 0 ? (
        <div className="py-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Produits
          </div>
          {matchingProducts.map((product) => (
            <Link
              key={product.id}
              to={getProductPath(product)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={onSelect}
              className="flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary"
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
                  <Package className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{product.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {product.category && <span className="truncate">{product.category}</span>}
                  <span className="font-mono font-semibold text-primary">{formatMoney(product.price)}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      product.status === 'out_of_stock'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    <Circle className="h-1.5 w-1.5 fill-current" />
                    {product.status === 'out_of_stock' ? 'Rupture' : 'En stock'}
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          Aucun produit trouvé
        </div>
      )}

      {matchingCategories.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Catégories</p>
          <div className="flex flex-wrap gap-2">
            {matchingCategories.map((category) => (
              <button
                key={category}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onCategorySelect?.(category);
                  onSelect?.();
                }}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
