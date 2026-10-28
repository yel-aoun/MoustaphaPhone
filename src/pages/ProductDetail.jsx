import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Facebook,
  Heart,
  MessageCircle,
  Minus,
  Maximize2,
  Package,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import StoreLayout from '@/components/store/StoreLayout';
import ProductCard from '@/components/store/ProductCard';
import DeliveryTimeline from '@/components/store/DeliveryTimeline';
import { showCartIsland } from '@/components/store/CartIsland';
import RecentlyViewedSection from '@/components/store/RecentlyViewedSection';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { useCompare } from '@/lib/compareStore';
import { addRecentlyViewed } from '@/lib/recentStore';
import { buildWhatsAppURL } from '@/lib/cartStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { formatMoney, getProductUrl, productMatchesSlug, slugify } from '@/lib/products';
import { storeBrand } from '@/lib/brand';
import { getColorForImage, getColorImageIndex, getProductImages } from '@/lib/productOptions';
import { productJsonLd, useSeo } from '@/lib/seo';
import { trackProductEvent } from '@/lib/storeEvents';
import { toast } from 'sonner';

const BADGE_LABELS = {
  best_seller: 'Best seller',
  new_arrival: 'Nouveau',
  limited_stock: 'Stock limité',
  recommended: 'Recommandé',
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });

  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { compareIds, toggleCompare } = useCompare();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const product = useMemo(
    () => products.find((item) => productMatchesSlug(item, slug)),
    [products, slug]
  );
  const productUrl = product ? getProductUrl(product) : window.location.href;
  const images = product ? getProductImages(product) : [];
  const related = product
    ? products
        .filter((item) => item.id !== product.id && item.status !== 'inactive' && item.category === product.category)
        .slice(0, 5)
    : [];
  const colors = Array.isArray(product?.colors) ? product.colors.filter((color) => color.name && color.hex) : [];
  const specs = Array.isArray(product?.specs)
    ? product.specs.filter((spec) => spec.name && spec.value)
    : [];
  const badges = Array.isArray(product?.badges) ? product.badges : [];
  const [selectedColor, setSelectedColor] = useState(null);
  const imageIndexForColor = (color, fallbackIndex = colors.findIndex((item) => item.name === color?.name)) =>
    getColorImageIndex(color, fallbackIndex, images);

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

  useSeo({
    title: product ? product.name : 'Produit',
    description: product?.description || `Produit ${storeBrand.name} disponible avec livraison partout au Maroc.`,
    image: product?.image_url,
    url: productUrl,
    type: 'product',
    jsonLd: product ? productJsonLd(product, productUrl) : null,
  });

  useEffect(() => {
    if (!product) return;
    setQty(1);
    const firstColor = colors[0] || null;
    setSelectedColor(firstColor);
    setActiveImage(Math.max(0, firstColor ? imageIndexForColor(firstColor, 0) : 0));
    addRecentlyViewed(product);
    trackProductEvent('product_view', product, { source: 'product_page' });
  }, [product?.id]);

  const activeSrc = images[activeImage];
  const selectedColorImageSrc = selectedColor
    ? images[imageIndexForColor(selectedColor)] || activeSrc
    : activeSrc;
  const isOutOfStock = product?.status === 'out_of_stock';
  const isWishlisted = product ? wishlist.some((item) => item.id === product.id) : false;
  const isCompared = product ? compareIds.includes(product.id) : false;
  const discount =
    product?.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : null;

  const handleAdd = () => {
    if (!product || isOutOfStock) return;
    for (let i = 0; i < qty; i++) {
      addToCart({
        ...product,
        image_url: selectedColorImageSrc || product.image_url,
        selectedColor: selectedColor?.name,
        selectedColorHex: selectedColor?.hex,
        product_url: productUrl,
      });
    }
    trackProductEvent('add_to_cart', product, { source: 'product_page', quantity: qty });
    showCartIsland({ ...product, image_url: selectedColorImageSrc || product.image_url }, qty);
  };

  const handleWhatsApp = () => {
    if (!product || isOutOfStock) return;
    const label = selectedColor ? ` (${selectedColor.name})` : '';
    trackProductEvent('whatsapp_checkout', product, { source: 'product_page', quantity: qty });
    window.open(
      buildWhatsAppURL(
        [{
          ...product,
          image_url: selectedColorImageSrc || product.image_url,
          selectedColor: selectedColor?.name,
          selectedColorHex: selectedColor?.hex,
          name: `${product.name}${label}`,
          quantity: qty,
          product_url: productUrl,
        }],
        product.price * qty
      ),
      '_blank'
    );
  };

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft' && images.length > 1) selectImage((activeImage - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight' && images.length > 1) selectImage((activeImage + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeImage, images.length]);

  const prevImage = () => selectImage((activeImage - 1 + images.length) % images.length);
  const nextImage = () => selectImage((activeImage + 1) % images.length);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (images.length < 2) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) prevImage();
    else nextImage();
  };

  const handleCopyLink = async () => {
    if (!product) return;
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success('Lien produit copié');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const shareText = product ? encodeURIComponent(`${product.name} - ${formatMoney(product.price)}`) : '';
  const shareUrl = encodeURIComponent(productUrl);

  return (
    <StoreLayout hideTabBar hideWhatsApp>
      <div className="container-store pb-16 pt-6 sm:pt-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <span>/</span>
          <Link to="/boutique" className="hover:text-foreground">Boutique</Link>
          {product?.category && (
            <>
              <span>/</span>
              <Link to={`/category/${slugify(product.category)}`} className="hover:text-foreground">{product.category}</Link>
            </>
          )}
        </nav>

        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
            <div>
              <div className="aspect-square animate-pulse rounded-3xl bg-secondary" />
              <div className="mt-3 flex gap-2">
                {Array(4).fill(0).map((_, index) => (
                  <div key={index} className="h-20 w-20 animate-pulse rounded-lg bg-secondary" />
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-secondary" />
                <div className="h-7 w-20 animate-pulse rounded-full bg-secondary" />
              </div>
              <div className="h-10 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-8 w-1/2 animate-pulse rounded bg-secondary" />
              <div className="h-28 animate-pulse rounded-lg bg-secondary" />
              <div className="h-12 animate-pulse rounded-lg bg-secondary" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 animate-pulse rounded-lg bg-secondary" />
                <div className="h-12 animate-pulse rounded-lg bg-secondary" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive">
            Impossible de charger le produit. Vérifiez `/api/products` ou `/api/health` sur le domaine Vercel.
          </div>
        ) : !product ? (
          <div className="rounded-3xl bg-secondary p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Produit introuvable</h1>
            <Link to="/boutique" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">Retour à la boutique</Link>
            <p className="mt-2 text-sm text-muted-foreground">Ce produit n'est plus disponible ou le lien a changé.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
              <div className="min-w-0 lg:flex lg:flex-row-reverse lg:items-start lg:gap-3">
                <div
                  className="photo-well relative aspect-square flex-1 overflow-hidden rounded-3xl lg:aspect-[4/3.6]"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <span key={activeSrc} className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/3 animate-scan bg-gradient-to-b from-transparent via-primary/15 to-transparent [animation-iteration-count:1]" />
                  {activeSrc ? (
                    <img
                      src={cloudinaryImage(activeSrc, { width: 900 })}
                      srcSet={productImageSrcSet(activeSrc, [480, 720, 960])}
                      sizes="(min-width: 1024px) 54vw, 100vw"
                      alt={product.name}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onClick={() => setLightboxOpen(true)}
                      className={`relative h-full w-full cursor-zoom-in bg-transparent object-contain p-8 mix-blend-multiply ${isOutOfStock ? 'opacity-60' : ''}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                      <Package className="h-16 w-16 opacity-30" />
                    </div>
                  )}

                  {activeSrc && (
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white"
                      aria-label="Agrandir l'image"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white"
                        aria-label="Image précédente"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white"
                        aria-label="Image suivante"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
                    {images.map((image, index) => (
                      <button
                        key={`dot-${image}`}
                        type="button"
                        onClick={() => selectImage(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === activeImage ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                        }`}
                        aria-label={`Afficher l'image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-0 lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        onClick={() => selectImage(index)}
                        className={`photo-well h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition lg:h-20 lg:w-20 ${
                          index === activeImage ? 'ring-2 ring-foreground' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={cloudinaryImage(image, { width: 160, height: 160, crop: 'pad' })} alt="" loading="lazy" decoding="async" className="h-full w-full bg-transparent object-contain p-2 mix-blend-multiply" />
                        {getColorForImage(colors, images, index) && (
                          <span className="sr-only">Couleur {getColorForImage(colors, images, index)?.name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {isOutOfStock ? (
                      <span className="text-xs font-semibold text-muted-foreground">Épuisé</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" /> En stock
                      </span>
                    )}
                    {discount !== null && (
                      <span className="text-xs font-semibold text-deal">−{discount}%</span>
                    )}
                    {badges.map((badge) => (
                      <span key={badge} className="text-xs font-semibold text-deal">
                        {BADGE_LABELS[badge] || badge}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-tight">{product.name}</h1>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-semibold text-foreground">{formatMoney(product.price)}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-base text-muted-foreground line-through">{formatMoney(product.original_price)}</span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <div className="border-t border-border pt-5">
                    <h2 className="text-sm font-semibold text-foreground">Description</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.description}</p>
                  </div>
                )}

                {specs.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <h2 className="text-sm font-semibold text-foreground">Caractéristiques</h2>
                    <dl className="mt-3 divide-y divide-border">
                      {specs.map((spec) => (
                        <div key={`${spec.name}-${spec.value}`} className="grid grid-cols-[42%_1fr] gap-3 py-2 text-sm">
                          <dt className="font-medium text-muted-foreground">{spec.name}</dt>
                          <dd className="font-semibold text-foreground">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {colors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Couleur {selectedColor ? <span className="font-normal text-muted-foreground">: {selectedColor.name}</span> : null}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color, colorIndex) => (
                        <button
                          key={color.name}
                          onClick={() => selectColor(color, colorIndex)}
                          title={color.name}
                          aria-label={`Choisir la couleur ${color.name}`}
                          className={`h-9 w-9 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/30 transition ${
                            selectedColor?.name === color.name
                              ? 'outline outline-2 outline-offset-2 outline-foreground'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!isOutOfStock && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Quantité</span>
                    <div className="flex items-center gap-1 rounded-full border border-border p-1">
                      <button onClick={() => setQty((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{qty}</span>
                      <button onClick={() => setQty((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {qty > 1 && <span className="text-sm text-muted-foreground">= {formatMoney(product.price * qty)}</span>}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={handleAdd} disabled={isOutOfStock} className="h-12 rounded-full font-medium">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </Button>
                  <Button onClick={handleWhatsApp} disabled={isOutOfStock} variant="outline" className="h-12 rounded-full font-medium">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
                    {isWishlisted ? 'Dans vos favoris' : 'Favoris'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(product)}
                    aria-pressed={isCompared}
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors ${isCompared ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Scale className="h-4 w-4" />
                    {isCompared ? 'Comparé' : 'Comparer'}
                  </button>
                  <span className="hidden h-4 w-px bg-border sm:block" />
                  <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground">
                    <Copy className="h-4 w-4" /> Copier le lien
                  </button>
                  <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground">
                    <Share2 className="h-4 w-4" /> Partager
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Partager sur Facebook" className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
                    <Facebook className="h-4 w-4" />
                  </a>
                </div>

                <DeliveryTimeline />
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-20">
                <div className="mb-6 flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="section-title">Vous aimerez aussi</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <Link
                    to={product.category ? `/category/${slugify(product.category)}` : '/'}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Tout voir
                  </Link>
                </div>
                <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  {related.map((item, index) => (
                    <div key={item.id} className="w-[46vw] max-w-[220px] shrink-0 sm:w-[220px]">
                      <ProductCard
                        product={item}
                        onAddToCart={addToCart}
                        imagePriority={index < 2}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-20" />
            <RecentlyViewedSection
              products={products.filter((item) => item.status !== 'inactive')}
              currentProductId={product.id}
              onAddToCart={addToCart}
            />
          </>
        )}
      </div>

      {lightboxOpen && activeSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 p-4 text-white backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Image agrandie"
          onClick={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Fermer l'image"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div
            className="flex h-full flex-col items-center justify-center gap-4"
            onClick={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}
          >
            <img
              src={cloudinaryImage(activeSrc, { width: 1200 })}
              alt={product?.name || ''}
              className="max-h-[82vh] w-full max-w-5xl object-contain"
            />
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {images.map((image, index) => (
                  <button
                    key={`lightbox-dot-${image}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeImage ? 'w-7 bg-white' : 'w-2 bg-white/35'
                    }`}
                    aria-label={`Afficher l'image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {product && (
        <div className="liquid-glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-[26px] px-3 pb-3 pt-2.5 md:hidden">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted-foreground">{product.name}</p>
              <p className="text-lg font-semibold text-foreground">
                {formatMoney(product.price * qty)}
              </p>
            </div>
            {isOutOfStock && <span className="text-xs font-semibold text-muted-foreground">Épuisé</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleAdd} disabled={isOutOfStock} className="h-11 rounded-full text-sm font-medium">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
            <Button
              onClick={handleWhatsApp}
              disabled={isOutOfStock}
              variant="outline"
              className="h-11 rounded-full text-sm font-medium"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      )}

    </StoreLayout>
  );
}
