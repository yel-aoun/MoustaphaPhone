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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-soft">
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
            className={`h-full w-full bg-white object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04] ${
              isOutOfStock ? 'opacity-50' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-muted-foreground">
            <Package className="h-10 w-10 opacity-35" />
          </div>
        )}

        {/* Discount sticker */}
        {discount !== null && !isOutOfStock && (
          <span className="absolute left-0 top-3 z-10 rounded-r-lg bg-deal px-2.5 py-1 text-xs font-extrabold text-deal-foreground shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Badges */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1">
          {visibleBadges.map((badge) => (
            <span
              key={badge}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
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
            <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
              Rupture de stock
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          type="button"
          aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-150 active:scale-90 ${
            isWishlisted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-zinc-500 hover:border-primary hover:text-primary'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-3">
        {product.category && (
          <p className="truncate text-[11px] font-semibold text-muted-foreground">{product.category}</p>
        )}
        <Link
          to={getProductPath(product)}
          onClick={(e) => e.stopPropagation()}
          className="min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground line-clamp-2 hover:text-primary"
        >
          {product.name}
        </Link>

        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.slice(0, 5).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] font-semibold text-muted-foreground">+{colors.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-extrabold leading-tight text-primary">
              {product.price?.toLocaleString('fr-MA')} <span className="text-xs font-bold">DH</span>
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {product.original_price?.toLocaleString('fr-MA')} DH
              </span>
            )}
          </div>
          <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold ${isOutOfStock ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <Circle className="h-1.5 w-1.5 fill-current" />
            {isOutOfStock ? 'Rupture de stock' : 'En stock · Livraison rapide'}
          </p>
        </div>

        {/* CTA */}
        <div onClick={(e) => e.stopPropagation()} className="mt-1.5 flex gap-1.5">
          <Button
            onClick={handleAdd}
            disabled={isOutOfStock}
            size="sm"
            className={`h-9 flex-1 rounded-lg text-xs font-bold transition-all duration-200 ${
              isOutOfStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                : inCart
                ? 'border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            aria-label={isOutOfStock ? 'Produit indisponible' : `Ajouter ${product.name} au panier`}
          >
            {isOutOfStock ? (
              'Indisponible'
            ) : added ? (
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Ajouté !</span>
            ) : inCart ? (
              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Panier ({cartItem.quantity})</span>
            ) : (
              <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5" /> Ajouter</span>
            )}
          </Button>
          <button
            type="button"
            onClick={handleCompare}
            aria-pressed={isCompared}
            aria-label={isCompared ? 'Retirer de la comparaison' : 'Comparer'}
            title="Comparer"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              isCompared
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            <Scale className="h-4 w-4" />
          </button>
          <Link
            to={getProductPath(product)}
            aria-label={`Voir les détails de ${product.name}`}
            title="Détails"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
