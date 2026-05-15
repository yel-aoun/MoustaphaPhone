import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
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
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import ProductCard from '@/components/store/ProductCard';
import ProductModal from '@/components/store/ProductModal';
import CartSidebar from '@/components/store/CartSidebar';
import WishlistSidebar from '@/components/store/WishlistSidebar';
import ComparePanel from '@/components/store/ComparePanel';
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
import { trackProductEvent } from '@/lib/analytics';
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });

  const { cart, addToCart, removeFromCart, updateQuantity, updateVariant, clearCart, totalItems, totalPrice } = useCart();
  const { wishlist, removeFromWishlist, totalWishlist, toggleWishlist } = useWishlist();
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
    const update = () => {
      const header = document.querySelector('header');
      if (header) {
        document.documentElement.style.setProperty('--header-h', `${Math.ceil(header.getBoundingClientRect().height)}px`);
      }
    };
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, []);

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

  const handleCategorySelect = (category) => {
    if (category && category !== 'Tous') navigate(`/category/${slugify(category)}`);
    else navigate('/');
  };

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
    <div className="min-h-screen bg-background">
      <Header
        totalItems={totalItems}
        onCartOpen={() => setCartOpen(true)}
        totalWishlist={totalWishlist}
        onWishlistOpen={() => setWishlistOpen(true)}
        searchQuery=""
        onSearchChange={(value) => navigate(`/?q=${encodeURIComponent(value)}`)}
        activeCategory={product?.category || 'Tous'}
        onCategorySelect={handleCategorySelect}
        products={products.filter((item) => item.status !== 'inactive')}
      />

      <main
        className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 sm:pb-16 lg:px-10"
        style={{ paddingTop: 'calc(var(--header-h, 160px) + 16px)' }}
      >
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Link>

        {isLoading ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
            <div>
              <div className="aspect-square animate-pulse rounded-lg border border-border bg-secondary" />
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
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h1 className="text-2xl font-bold text-foreground">Produit introuvable</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ce produit n'est plus disponible ou le lien a changé.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
              <div className="min-w-0 lg:flex lg:flex-row-reverse lg:items-start lg:gap-3">
                <div
                  className="relative aspect-square flex-1 overflow-hidden rounded-lg border border-border bg-white lg:aspect-[4/3]"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
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
                      className={`h-full w-full cursor-zoom-in object-contain p-5 ${isOutOfStock ? 'opacity-60' : ''}`}
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
                      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
                      aria-label="Agrandir l'image"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  )}

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
                        aria-label="Image précédente"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background"
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
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white transition lg:h-20 lg:w-20 ${
                          index === activeImage ? 'border-primary shadow-sm' : 'border-border opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={cloudinaryImage(image, { width: 160, height: 160, crop: 'pad' })} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-1.5" />
                        {getColorForImage(colors, images, index) && (
                          <span className="sr-only">Couleur {getColorForImage(colors, images, index)?.name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5 lg:sticky lg:top-[calc(var(--header-h,160px)+16px)] lg:self-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.category && (
                      <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {product.category}
                      </span>
                    )}
                    {isOutOfStock ? (
                      <span className="rounded-full bg-orange-500/12 px-3 py-1 text-xs font-bold text-orange-500">Rupture</span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-600">En stock</span>
                    )}
                    {discount !== null && (
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">-{discount}%</span>
                    )}
                    {badges.map((badge) => (
                      <span key={badge} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {BADGE_LABELS[badge] || badge}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl">{product.name}</h1>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-4xl font-extrabold text-foreground">{formatMoney(product.price)}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="font-mono text-lg text-muted-foreground line-through">{formatMoney(product.original_price)}</span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <div className="rounded-lg border border-border bg-secondary/25 p-4">
                    <h2 className="text-sm font-bold text-foreground">Description</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{product.description}</p>
                  </div>
                )}

                {specs.length > 0 && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <h2 className="text-sm font-bold text-foreground">Fiche technique</h2>
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
                          className={`h-9 w-9 rounded-full border transition ${
                            selectedColor?.name === color.name
                              ? 'scale-110 ring-2 ring-primary ring-offset-2'
                              : 'border-border hover:scale-105'
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
                    <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                      <button onClick={() => setQty((value) => Math.max(1, value - 1))} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold">{qty}</span>
                      <button onClick={() => setQty((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {qty > 1 && <span className="font-mono text-sm text-muted-foreground">= {formatMoney(product.price * qty)}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                  <Truck className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium text-foreground">Livraison partout au Maroc</span>
                  <span className="text-muted-foreground">40 MAD</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button onClick={handleAdd} disabled={isOutOfStock} className="h-12 rounded-lg font-semibold">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </Button>
                  <Button onClick={handleWhatsApp} disabled={isOutOfStock} className="h-12 rounded-lg bg-green-500 font-semibold text-white hover:bg-green-600">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleWishlist(product)}
                    className="h-11 rounded-lg font-semibold"
                    aria-label={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {isWishlisted ? <Check className="mr-2 h-4 w-4 text-red-500" /> : <Heart className="mr-2 h-4 w-4" />}
                    Favoris
                  </Button>
                  <Button
                    type="button"
                    variant={isCompared ? 'default' : 'outline'}
                    onClick={() => toggleCompare(product)}
                    className="h-11 rounded-lg font-semibold"
                    aria-pressed={isCompared}
                  >
                    <Scale className="mr-2 h-4 w-4" />
                    {isCompared ? 'Comparé' : 'Comparer'}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copier
                  </button>
                  <a
                    href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-muted-foreground transition-colors hover:border-green-500/35 hover:text-green-600"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-muted-foreground transition-colors hover:border-blue-500/35 hover:text-blue-600"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    Facebook
                  </a>
                </div>

                <div className="grid gap-2 rounded-lg border border-border bg-secondary/25 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Livraison partout au Maroc sous 24-72h selon la ville.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-primary" />
                    <span>Retours acceptés sous 7 jours si le produit est intact.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Support {storeBrand.name} disponible avant et après commande.</span>
                  </div>
                </div>
              </div>
            </section>

            {related.length > 0 && (
              <section className="mt-12">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-normal text-foreground">Produits similaires</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <Link
                    to={product.category ? `/category/${slugify(product.category)}` : '/'}
                    className="text-sm font-semibold text-primary"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {related.map((item, index) => (
                    <div key={item.id} className="w-[72vw] max-w-[240px] shrink-0 sm:w-[220px]">
                      <ProductCard
                        product={item}
                        onAddToCart={addToCart}
                        onQuickView={setSelectedProduct}
                        imagePriority={index < 2}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <RecentlyViewedSection
              products={products.filter((item) => item.status !== 'inactive')}
              currentProductId={product.id}
              onAddToCart={addToCart}
              onQuickView={setSelectedProduct}
            />
          </>
        )}
      </main>

      {lightboxOpen && activeSrc && (
        <div className="fixed inset-0 z-50 bg-black/92 p-4 text-white" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
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
          <div className="flex h-full flex-col items-center justify-center gap-4">
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/96 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted-foreground">{product.name}</p>
              <p className="font-mono text-lg font-extrabold text-foreground">
                {formatMoney(product.price * qty)}
              </p>
            </div>
            {isOutOfStock ? (
              <span className="rounded-full bg-orange-500/12 px-3 py-1 text-xs font-bold text-orange-500">Rupture</span>
            ) : (
              <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-bold text-emerald-600">En stock</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleAdd} disabled={isOutOfStock} className="h-11 rounded-lg text-sm font-semibold">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
            <Button
              onClick={handleWhatsApp}
              disabled={isOutOfStock}
              className="h-11 rounded-lg bg-green-500 text-sm font-semibold text-white hover:bg-green-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      )}

      <Footer onCategorySelect={handleCategorySelect} />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <WishlistSidebar
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={removeFromWishlist}
        onAddToCart={addToCart}
      />

      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totalPrice={totalPrice}
        products={products}
        onUpdateQuantity={updateQuantity}
        onUpdateVariant={updateVariant}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      <ComparePanel products={products.filter((item) => item.status !== 'inactive')} />

    </div>
  );
}
