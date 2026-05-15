import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, ArrowDown, Eye, Sparkles, Package, Truck, ShieldCheck, WalletCards } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ZelligePattern from './ZelligePattern';
import { DEFAULT_HERO_CONFIG } from '@/lib/heroStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};
const slideTransition = { duration: 0.32, ease: 'easeInOut' };

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
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = (i) => { setDirection(i > index ? 1 : -1); setIndex(i); };
  const prev = () => { setDirection(-1); setIndex((i) => (i - 1 + slides.length) % slides.length); };
  const next = () => { setDirection(1); setIndex((i) => (i + 1) % slides.length); };

  const current = slides[index];

  if (!current) {
    return (
      <div className="relative mb-10 -mx-4 sm:-mx-6 lg:-mx-10 overflow-hidden border-y sm:border border-border/70 bg-secondary/60 px-4 py-10 sm:rounded-lg sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="space-y-4">
            <div className="h-5 w-28 animate-pulse rounded-full bg-background" />
            <div className="h-10 w-3/4 animate-pulse rounded-lg bg-background" />
            <div className="h-4 w-full max-w-sm animate-pulse rounded bg-background" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-background" />
          </div>
          <div className="aspect-[5/4] animate-pulse rounded-lg bg-background" />
        </div>
      </div>
    );
  }

  const { product } = current;
  const title = cfg.defaultTitle || DEFAULT_HERO_CONFIG.defaultTitle;
  const subtitle = cfg.defaultSubtitle || DEFAULT_HERO_CONFIG.defaultSubtitle;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discount = hasDiscount
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <div className="relative mb-10 -mx-4 overflow-hidden border-y border-border/70 bg-secondary/45 px-4 py-6 sm:-mx-6 sm:rounded-lg sm:border sm:px-6 md:py-8 lg:-mx-10 lg:px-10">
      <ZelligePattern id="hero" opacity={0.035} />

      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:gap-10">
        {/* Left: text */}
        <div className="relative order-2 overflow-hidden md:order-1">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Collection Logitech
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                {title.split(' ').map((word, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <span key={i}>
                      {isLast ? <span className="text-primary">{word}</span> : word}
                      {!isLast && ' '}
                    </span>
                  );
                })}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 border-y border-border/70 py-4 text-sm text-muted-foreground sm:grid-cols-3">
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Livraison Maroc
              </span>
              <span className="inline-flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-primary" />
                Paiement à la livraison
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Produits garantis
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => onQuickView?.(product)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Eye className="h-4 w-4" />
                Voir le produit
              </button>
              <button
                onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                Catalogue
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      {/* Right: product image */}
      <div
        className="relative order-1 aspect-[5/4] w-full select-none overflow-hidden rounded-lg border border-border bg-white shadow-sm md:order-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Dot navigation */}
        {slides.length > 1 && (
          <div className="absolute top-3 right-3 z-20 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Diapositive ${i + 1}`}
                aria-current={i === index}
                className={`rounded-full transition-all duration-300 ${
                  i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Prev/next arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2.5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
              aria-label="Diapositive precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2.5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
              aria-label="Diapositive suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image slide */}
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={`img-${index}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="absolute inset-0 cursor-pointer"
            onClick={() => onQuickView?.(product)}
          >
            {product.image_url ? (
              <img
                src={cloudinaryImage(product.image_url, { width: 960 })}
                srcSet={productImageSrcSet(product.image_url, [540, 720, 960, 1200])}
                sizes="(min-width: 768px) 52vw, 100vw"
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className={`w-full h-full object-contain p-5 ${product.status === 'out_of_stock' ? 'opacity-60' : ''}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <Package className="h-14 w-14 opacity-35" />
              </div>
            )}

            {/* Status/discount badges */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
              {product.status === 'out_of_stock' && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-orange-500/90 rounded-full text-white">
                  Rupture de stock
                </span>
              )}
              {discount !== null && product.status !== 'out_of_stock' && (
                <span className="flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                  <Flame className="h-3 w-3" />-{discount}%
                </span>
              )}
            </div>

            {/* Bottom info overlay */}
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-border bg-background/95 px-3 py-3 shadow-sm backdrop-blur">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                Produit en avant
              </p>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-foreground font-semibold text-sm leading-tight line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{product.category}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg font-extrabold leading-none text-foreground">
                    {product.price?.toLocaleString('fr-MA')}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground">MAD</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
