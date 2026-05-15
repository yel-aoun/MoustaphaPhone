import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, Flame, Heart, Package, ExternalLink, Circle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/lib/wishlistStore';
import { useCart } from '@/lib/cartStore';
import { useCompare } from '@/lib/compareStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { getProductPath } from '@/lib/products';
import { trackProductEvent } from '@/lib/analytics';

const BADGE_LABELS = {
  best_seller: 'Best seller',
  new_arrival: 'Nouveau',
  limited_stock: 'Stock limité',
  recommended: 'Recommandé',
};

export default function ProductCard({ product, onAddToCart, onQuickView, imagePriority = false }) {
  const [added, setAdded] = useState(false);
  const { wishlist, toggleWishlist } = useWishlist();
  const { cart } = useCart();
  const { compareIds, toggleCompare } = useCompare();
  const isWishlisted = wishlist.some((i) => i.id === product.id);
  const isCompared = compareIds.includes(product.id);
  const cartItem = cart.find((i) => i.id === product.id);
  const inCart = !!cartItem;

  const isOutOfStock = product.status === 'out_of_stock';
  const isNew = product.created_date &&
    (Date.now() - new Date(product.created_date).getTime()) < 14 * 24 * 60 * 60 * 1000;
  const badges = Array.isArray(product.badges) ? product.badges : [];
  const visibleBadges = [
    ...(isNew && !badges.includes('new_arrival') ? ['new_arrival'] : []),
    ...badges,
  ].slice(0, 2);
  const colors = Array.isArray(product.colors) ? product.colors.filter(c => c.name && c.hex) : [];
  const hasImage = Boolean(product.image_url);
  const stockLabel = isOutOfStock ? 'Rupture' : 'En stock';

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    trackProductEvent('add_to_cart', product, { source: 'product_card' });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!isWishlisted) trackProductEvent('wishlist_add', product, { source: 'product_card' });
    toggleWishlist(product);
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    toggleCompare(product);
  };

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      {/* Image */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onQuickView?.(product)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onQuickView?.(product);
          }
        }}
        className="relative aspect-square cursor-zoom-in overflow-hidden bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label={`Aperçu rapide de ${product.name}`}
      >
        {hasImage ? (
          <img
            src={cloudinaryImage(product.image_url, { width: 420, height: 420, crop: 'pad' })}
            srcSet={productImageSrcSet(product.image_url, [280, 420, 640])}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            alt={product.name}
            loading={imagePriority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={imagePriority ? 'high' : 'low'}
            className={`h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] ${
              isOutOfStock ? 'opacity-50' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
            <Package className="h-10 w-10 opacity-35" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          {visibleBadges.map((badge) => (
            <span
              key={badge}
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full text-white shadow-sm ${
                badge === 'limited_stock'
                  ? 'bg-orange-500'
                  : badge === 'best_seller'
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
            >
              {BADGE_LABELS[badge] || badge}
            </span>
          ))}
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-orange-500 rounded-full text-white shadow-sm">
              Rupture
            </span>
          )}
        </div>

        {/* Top-right: heart + discount */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1.5">
          <button
            onClick={handleWishlist}
            type="button"
            aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-150 active:scale-90 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          {discount !== null && !isOutOfStock && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 rounded-full text-white shadow-sm">
              <Flame className="w-2.5 h-2.5" />
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            {product.category && (
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {product.category}
              </p>
            )}
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                isOutOfStock ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              <Circle className={`h-1.5 w-1.5 fill-current ${isOutOfStock ? 'text-orange-500' : 'text-emerald-500'}`} />
              {stockLabel}
            </span>
          </div>
          <h3 className="min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground line-clamp-2">
            {product.name}
          </h3>
        </div>

        {colors.length > 0 && (
          <div className="flex items-center gap-1">
            {colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{colors.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-base text-foreground leading-none">
                {product.price?.toLocaleString('fr-MA')}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">MAD</span>
            </div>
            {product.original_price && product.original_price > product.price && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-mono text-xs text-muted-foreground line-through">
                  {product.original_price?.toLocaleString('fr-MA')} MAD
                </span>
                <span className="text-[10px] font-semibold leading-tight text-orange-500">
                  Economisez {(product.original_price - product.price).toLocaleString('fr-MA')} MAD
                </span>
              </div>
            )}
          </div>

          {/* CTA — always visible */}
          <div onClick={(e) => e.stopPropagation()} className="space-y-2">
            <Button
              onClick={handleAdd}
              disabled={isOutOfStock}
              size="sm"
              className={`h-8 w-full text-xs font-semibold rounded-lg transition-all duration-200 ${
                isOutOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : added
                  ? 'bg-green-500 hover:bg-green-500 text-white'
                  : inCart
                  ? 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30'
                  : ''
              }`}
              aria-label={isOutOfStock ? 'Produit indisponible' : `Ajouter ${product.name} au panier`}
            >
              {isOutOfStock ? (
                'Indisponible'
              ) : added ? (
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Ajouté !</span>
              ) : inCart ? (
                <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Dans le panier ({cartItem.quantity})</span>
              ) : (
                <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Ajouter au panier</span>
              )}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={getProductPath(product)}
                aria-label={`Voir les détails de ${product.name}`}
                className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Détails</span>
              </Link>
              <button
                type="button"
                onClick={handleCompare}
                aria-pressed={isCompared}
                className={`flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  isCompared
                    ? 'border-primary/35 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/35 hover:text-primary'
                }`}
              >
                <Scale className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{isCompared ? 'Comparé' : 'Comparer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
