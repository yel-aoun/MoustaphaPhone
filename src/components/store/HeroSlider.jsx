import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Package, Truck, BadgeCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_HERO_CONFIG } from '@/lib/heroStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
};
const slideTransition = { duration: 0.35, ease: 'easeOut' };

function discountOf(product) {
  return product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;
}

function SideTile({ product, tone, label, onQuickView }) {
  if (!product) return null;
  const discount = discountOf(product);
  const dark = tone === 'dark';
  return (
    <button
      type="button"
      onClick={() => onQuickView?.(product)}
      className={`group relative flex min-h-[150px] flex-1 items-center gap-3 overflow-hidden rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 ${
        dark ? 'bg-foreground text-background' : 'bg-deal text-deal-foreground'
      }`}
    >
      <div className="relative z-10 min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-wide ${dark ? 'text-background/60' : 'text-deal-foreground/70'}`}>
          {label}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug">{product.name}</p>
        <p className="mt-2 text-lg font-extrabold">
          {product.price?.toLocaleString('fr-MA')} <span className="text-xs font-bold">DH</span>
        </p>
        {discount !== null && (
          <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${dark ? 'bg-deal text-deal-foreground' : 'bg-primary text-primary-foreground'}`}>
            -{discount}%
          </span>
        )}
      </div>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
        {product.image_url ? (
          <img
            src={cloudinaryImage(product.image_url, { width: 240, height: 240, crop: 'pad' })}
            alt={product.name}
            loading="lazy"
            className="h-full w-full bg-white object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="m-auto h-8 w-8 text-black/25" />
        )}
      </div>
    </button>
  );
}

export default function HeroSlider({ products = [], heroConfig, onQuickView }) {
  const cfg = heroConfig ?? DEFAULT_HERO_CONFIG;

  const slides = useMemo(() => {
    if (cfg.slides && cfg.slides.length > 0) {
      const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
      return cfg.slides
        .map((s) => {
          const product = productMap[s.productId];
          if (!product) return null;
          return { product };
        })
        .filter(Boolean)
        .slice(0, 5);
    }
    return products.slice(0, 5).map((product) => ({ product }));
  }, [cfg, products]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = (i) => { setDirection(i > index ? 1 : -1); setIndex(i); };
  const prev = () => { setDirection(-1); setIndex((i) => (i - 1 + slides.length) % slides.length); };
  const next = () => { setDirection(1); setIndex((i) => (i + 1) % slides.length); };

  const current = slides[index];

  if (!current) {
    return (
      <div className="mb-8 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="h-[340px] animate-pulse rounded-2xl bg-surface" />
        <div className="hidden gap-3 lg:grid">
          <div className="animate-pulse rounded-2xl bg-surface" />
          <div className="animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  const { product } = current;
  const title = cfg.defaultTitle || DEFAULT_HERO_CONFIG.defaultTitle;
  const subtitle = cfg.defaultSubtitle || DEFAULT_HERO_CONFIG.defaultSubtitle;
  const discount = discountOf(product);
  const nextProducts = slides.length > 1
    ? [slides[(index + 1) % slides.length]?.product, slides[(index + 2) % slides.length]?.product]
        .filter((p, i, arr) => p && p.id !== product.id && arr.findIndex((q) => q?.id === p.id) === i)
    : [];

  return (
    <section className="mb-8 grid gap-3 lg:grid-cols-[1fr_320px]">
      {/* Main banner */}
      <div
        className="relative overflow-hidden rounded-2xl bg-[hsl(356_78%_96%)] dark:bg-primary/10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 dark:bg-primary/[0.08]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-deal/25 dark:bg-deal/[0.07]" />

        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={`slide-${index}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="relative grid min-h-[340px] grid-cols-1 items-center gap-2 px-5 pb-14 pt-6 sm:grid-cols-[1.1fr_0.9fr] sm:px-10 sm:py-10"
          >
            {/* Copy */}
            <div className="order-2 space-y-4 sm:order-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-bold text-primary shadow-soft">
                <BadgeCheck className="h-3.5 w-3.5" />
                {product.category || 'Nouveautés'}
              </span>
              <h1 className="text-[1.9rem] font-extrabold leading-[1.08] text-foreground sm:text-4xl lg:text-[2.75rem]">
                {title}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{subtitle}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onQuickView?.(product)}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_-10px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Acheter maintenant
                </button>
                <button
                  onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex h-12 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-foreground underline-offset-4 hover:underline"
                >
                  Tout le catalogue
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                Livraison partout au Maroc · Paiement à la livraison
              </p>
            </div>

            {/* Product */}
            <button
              type="button"
              onClick={() => onQuickView?.(product)}
              className="relative order-1 mx-auto aspect-square w-full max-w-[300px] sm:order-2 sm:max-w-[340px]"
              aria-label={`Voir ${product.name}`}
            >
              <div className="absolute inset-[6%] rounded-full bg-background shadow-soft dark:bg-white" />
              {product.image_url ? (
                <img
                  src={cloudinaryImage(product.image_url, { width: 720 })}
                  srcSet={productImageSrcSet(product.image_url, [480, 720, 960])}
                  sizes="(min-width: 640px) 340px, 300px"
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`relative h-full w-full rounded-full bg-transparent object-contain p-[14%] mix-blend-multiply dark:mix-blend-normal ${
                    product.status === 'out_of_stock' ? 'opacity-60' : ''
                  }`}
                />
              ) : (
                <Package className="relative m-auto h-14 w-14 text-muted-foreground/40" />
              )}

              {/* Price sticker */}
              <span className="absolute right-0 top-[6%] flex h-[88px] w-[88px] rotate-[8deg] flex-col items-center justify-center rounded-full bg-deal text-deal-foreground shadow-lg sm:h-24 sm:w-24">
                {discount !== null && (
                  <span className="text-[11px] font-extrabold text-primary">-{discount}%</span>
                )}
                <span className="text-lg font-extrabold leading-none sm:text-xl">
                  {product.price?.toLocaleString('fr-MA')}
                </span>
                <span className="text-[10px] font-bold">DH</span>
              </span>

              {product.status === 'out_of_stock' && (
                <span className="absolute bottom-[8%] left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-[11px] font-bold text-background">
                  Rupture de stock
                </span>
              )}
              <span className="absolute -bottom-1 left-1/2 w-max max-w-full -translate-x-1/2 truncate rounded-lg bg-background px-3 py-1.5 text-xs font-bold text-foreground shadow-soft">
                {product.name}
              </span>
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between sm:left-10 sm:right-6">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Diapositive ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-primary' : 'w-2 bg-foreground/20 hover:bg-foreground/35'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground shadow-soft transition-colors hover:text-primary"
                aria-label="Diapositive précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground shadow-soft transition-colors hover:text-primary"
                aria-label="Diapositive suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side tiles */}
      {nextProducts.length > 0 && (
        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          <SideTile product={nextProducts[0]} tone="dark" label="À découvrir" onQuickView={onQuickView} />
          <SideTile product={nextProducts[1]} tone="deal" label="Bon plan" onQuickView={onQuickView} />
        </div>
      )}
    </section>
  );
}
