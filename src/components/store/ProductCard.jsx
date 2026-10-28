import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Heart, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useWishlist } from '@/lib/wishlistStore';
import { useCart } from '@/lib/cartStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { formatMoney, getProductPath } from '@/lib/products';
import { trackProductEvent } from '@/lib/storeEvents';
import TiltCard from '@/components/store/fx/TiltCard';

const BADGE_LABELS = {
  best_seller: 'Best seller',
  new_arrival: 'Nouveau',
  limited_stock: 'Stock limité',
  recommended: 'Recommandé',
};

export default function ProductCard({ product, onAddToCart, imagePriority = false }) {
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const { cart } = useCart();
  const isWishlisted = wishlist.some((i) => i.id === product.id);
  const inCart = cart.some((i) => i.id === product.id);

  const isOutOfStock = product.status === 'out_of_stock';
  const isNew = product.created_date &&
    (Date.now() - new Date(product.created_date).getTime()) < 14 * 24 * 60 * 60 * 1000;
  const badges = Array.isArray(product.badges) ? product.badges : [];
  const label = isOutOfStock
    ? 'Épuisé'
    : BADGE_LABELS[badges[0]] || (isNew ? 'Nouveau' : null);
  const colors = Array.isArray(product.colors) ? product.colors.filter((c) => c.name && c.hex) : [];
  const path = getProductPath(product);

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart?.(product);
    trackProductEvent('add_to_cart', product, { source: 'product_card' });
    setAdded(true);
    toast.success(`${product.name} ajouté au panier`, {
      action: { label: 'Voir le panier', onClick: () => navigate('/panier') },
    });
    setTimeout(() => setAdded(false), 1400);
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isWishlisted) trackProductEvent('wishlist_add', product, { source: 'product_card' });
    toggleWishlist(product);
  };

  return (
    <Link to={path} className="group flex h-full flex-col" aria-label={product.name}>
      <TiltCard className="rounded-2xl" max={6} glare={false}>
      <div className="photo-well relative aspect-[4/5] overflow-hidden rounded-2xl">
        {/* Light sweep on hover */}
        <span className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-1/3 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-shine" />
        {product.image_url ? (
          <img
            src={cloudinaryImage(product.image_url, { width: 480, height: 600, crop: 'pad' })}
            srcSet={productImageSrcSet(product.image_url, [320, 480, 720])}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            alt={product.name}
            loading={imagePriority ? 'eager' : 'lazy'}
            decoding="async"
            className={`h-full w-full bg-transparent object-contain p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04] ${
              isOutOfStock ? 'opacity-45' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-10 w-10 opacity-30" />
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-background/90 transition-all active:scale-90 ${
            isWishlisted ? 'text-primary' : 'text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>
      </TiltCard>

      <div className="flex flex-1 flex-col px-1 pt-3">
        {label && (
          <p className={`text-[11px] font-semibold ${isOutOfStock ? 'text-muted-foreground' : 'text-deal'}`}>{label}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.name}</h3>

        {colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {colors.slice(0, 6).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {colors.length > 6 && <span className="text-[10px] text-muted-foreground">+{colors.length - 6}</span>}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{formatMoney(product.price)}</p>
            {discount !== null && (
              <p className="text-[11px] text-muted-foreground">
                <span className="line-through">{formatMoney(product.original_price)}</span>
                <span className="ml-1.5 font-semibold text-deal">−{discount}%</span>
              </p>
            )}
          </div>
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
                added || inCart
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {added || inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
