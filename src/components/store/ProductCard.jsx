import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, Heart, Package, ExternalLink, Circle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/lib/wishlistStore';
import { useCart } from '@/lib/cartStore';
import { useCompare } from '@/lib/compareStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { getProductPath } from '@/lib/products';
import { trackProductEvent } from '@/lib/storeEvents';

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
  ].slice(0, 1);
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-1.5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_50px_-24px_hsl(var(--primary)/0.35)]">
      {/* Image well */}
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
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-[18px] bg-secondary/70 text-left dark:bg-[hsl(240_6%_88%)] focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            className={`h-full w-full bg-transparent object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.06] ${
              isOutOfStock ? 'opacity-50 grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground dark:text-zinc-500">
            <Package className="h-10 w-10 opacity-35" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {discount !== null && !isOutOfStock && (
            <span className="rounded-full bg-neon px-2 py-0.5 font-mono text-[10px] font-bold text-neon-foreground">
              -{discount}%
            </span>
          )}
          {visibleBadges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider ${
                badge === 'limited_stock'
                  ? 'bg-orange-500 text-white'
                  : badge === 'best_seller'
                  ? 'bg-foreground text-background'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {BADGE_LABELS[badge] || badge}
            </span>
          ))}
          {isOutOfStock && (
            <span className="rounded-full bg-foreground/80 px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-background">
              Rupture
            </span>
          )}
        </div>

        {/* Top-right actions */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleWishlist}
            type="button"
            aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-background/80 text-muted-foreground backdrop-blur hover:text-red-500 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompare}
            type="button"
            aria-pressed={isCompared}
            aria-label={isCompared ? 'Retirer de la comparaison' : 'Comparer'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
              isCompared
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/80 text-muted-foreground backdrop-blur hover:text-primary sm:translate-x-1 sm:opacity-0 sm:delay-75 sm:group-hover:translate-x-0 sm:group-hover:opacity-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colour swatches */}
        {colors.length > 0 && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-1 backdrop-blur">
            {colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 shrink-0 rounded-full ring-1 ring-foreground/15"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 5 && (
              <span className="pl-0.5 font-mono text-[9px] text-muted-foreground">+{colors.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 px-2 pb-1.5 pt-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            {product.category && (
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {product.category}
              </p>
            )}
            <span
              className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-medium ${
                isOutOfStock ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <Circle className={`h-1.5 w-1.5 fill-current ${isOutOfStock ? '' : 'animate-pulse'}`} />
              {stockLabel}
            </span>
          </div>
          <Link
            to={getProductPath(product)}
            onClick={(e) => e.stopPropagation()}
            className="block min-h-[2.5rem] text-sm font-medium leading-snug text-foreground line-clamp-2 transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          {/* Price */}
          <div className="min-w-0">
            {product.original_price && product.original_price > product.price && (
              <span className="block font-mono text-[11px] text-muted-foreground line-through">
                {product.original_price?.toLocaleString('fr-MA')}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-semibold leading-none tracking-tight text-foreground">
                {product.price?.toLocaleString('fr-MA')}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">MAD</span>
            </div>
          </div>

          {/* Details link (desktop) */}
          <Link
            to={getProductPath(product)}
            aria-label={`Voir les détails de ${product.name}`}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* CTA */}
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={handleAdd}
            disabled={isOutOfStock}
            size="sm"
            className={`h-9 w-full rounded-full text-xs font-semibold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : added
                ? 'bg-neon text-neon-foreground hover:bg-neon'
                : inCart
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
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
        </div>
      </div>
    </div>
  );
}
