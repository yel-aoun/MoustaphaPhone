import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Heart,
  Package,
  ShoppingCart,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/lib/wishlistStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { formatMoney, getProductPath } from '@/lib/products';
import { getColorForImage, getColorImageIndex, getProductImages } from '@/lib/productOptions';
import { trackProductEvent } from '@/lib/analytics';

const BADGE_LABELS = {
  best_seller: 'Best seller',
  new_arrival: 'Nouveau',
  limited_stock: 'Stock limité',
  recommended: 'Recommandé',
};

export default function ProductModal({ product, onClose, onAddToCart }) {
  const { wishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);

  const images = getProductImages(product);
  const colors = Array.isArray(product.colors) ? product.colors.filter((color) => color.name && color.hex) : [];
  const badges = Array.isArray(product.badges) ? product.badges.slice(0, 3) : [];
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const isOutOfStock = product.status === 'out_of_stock';
  const activeSrc = images[activeImage];
  const imageIndexForColor = (color, fallbackIndex = colors.findIndex((item) => item.name === color?.name)) =>
    getColorImageIndex(color, fallbackIndex, images);
  const selectedColorImageSrc = selectedColor
    ? images[imageIndexForColor(selectedColor)] || activeSrc
    : activeSrc;
  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  useEffect(() => {
    const firstColor = colors[0] || null;
    setSelectedColor(firstColor);
    setActiveImage(Math.max(0, firstColor ? imageIndexForColor(firstColor, 0) : 0));
    trackProductEvent('product_view', product, { source: 'quick_view' });
  }, [product?.id]);

  const selectImage = (index) => {
    setActiveImage(index);
    const colorForImage = getColorForImage(colors, images, index);
    if (colorForImage) setSelectedColor(colorForImage);
  };

  const selectColor = (color, colorIndex) => {
    setSelectedColor(color);
    const imageIndex = imageIndexForColor(color, colorIndex);
    if (imageIndex >= 0) setActiveImage(imageIndex);
  };

  const prevImage = () => selectImage((activeImage - 1 + images.length) % images.length);
  const nextImage = () => selectImage((activeImage + 1) % images.length);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart({
      ...product,
      image_url: selectedColorImageSrc || product.image_url,
      selectedColor: selectedColor?.name || null,
      selectedColorHex: selectedColor?.hex || null,
    });
    trackProductEvent('add_to_cart', product, { source: 'quick_view' });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const handleDetailsClick = () => {
    trackProductEvent('product_details_click', product, { source: 'quick_view' });
    onClose?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 32, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 32, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          onClick={(event) => event.stopPropagation()}
          className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative shrink-0 bg-white">
            {discount !== null && !isOutOfStock && (
              <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                <Flame className="h-3 w-3" />
                -{discount}%
              </span>
            )}

            <div className="relative h-[46vh] min-h-[260px] max-h-[420px] sm:h-[410px]">
              {activeSrc ? (
                <motion.img
                  key={activeSrc}
                  src={cloudinaryImage(activeSrc, { width: 820, height: 820, crop: 'pad' })}
                  srcSet={productImageSrcSet(activeSrc, [420, 640, 900])}
                  sizes="(min-width: 640px) 640px, 100vw"
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className={`h-full w-full object-contain p-4 sm:p-7 ${isOutOfStock ? 'opacity-60' : ''}`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Package className="h-14 w-14 opacity-35" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-secondary/25 px-4 py-3">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => selectImage(index)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-white transition ${
                      index === activeImage ? 'border-primary shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Afficher l'image ${index + 1}`}
                  >
                    <img
                      src={cloudinaryImage(image, { width: 140, height: 140, crop: 'pad' })}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {badges.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {badges.map((badge) => (
                      <span key={badge} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {BADGE_LABELS[badge] || badge}
                      </span>
                    ))}
                  </div>
                )}
                {product.category && (
                  <p className="mb-1 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {product.category}
                  </p>
                )}
                <h2 className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isWishlisted
                    ? 'bg-red-500 text-white'
                    : 'border border-border bg-background text-muted-foreground hover:text-red-500'
                }`}
                aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-2xl font-extrabold text-foreground sm:text-3xl">
                {formatMoney(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="font-mono text-sm text-muted-foreground line-through">
                  {formatMoney(product.original_price)}
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  isOutOfStock ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-600'
                }`}
              >
                {isOutOfStock ? 'Rupture de stock' : 'En stock'}
              </span>
            </div>

            {colors.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Couleur {selectedColor ? <span className="font-normal">: {selectedColor.name}</span> : null}
                </span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color, colorIndex) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => selectColor(color, colorIndex)}
                      title={color.name}
                      aria-label={`Choisir la couleur ${color.name}`}
                      className={`h-7 w-7 rounded-full border shadow-sm transition ${
                        selectedColor?.name === color.name
                          ? 'scale-105 ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-background px-5 py-4 sm:px-6">
            <Button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`h-11 rounded-lg text-sm font-semibold ${added ? 'bg-green-500 hover:bg-green-500' : ''}`}
            >
              {isOutOfStock ? (
                'Indisponible'
              ) : added ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Ajouté
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter
                </span>
              )}
            </Button>
            <Link
              to={getProductPath(product)}
              onClick={handleDetailsClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Détails
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
