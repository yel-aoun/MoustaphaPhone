import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUpRight, Package, Truck, ShieldCheck, WalletCards } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_HERO_CONFIG } from '@/lib/heroStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.96 }),
};
const slideTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };
const SLIDE_MS = 5000;

const PERKS = [
  { icon: Truck, label: 'Livraison Maroc' },
  { icon: WalletCards, label: 'Paiement à la livraison' },
  { icon: ShieldCheck, label: 'Produits garantis' },
];

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
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = (i) => { setDirection(i > index ? 1 : -1); setIndex(i); };
  const prev = () => { setDirection(-1); setIndex((i) => (i - 1 + slides.length) % slides.length); };
  const next = () => { setDirection(1); setIndex((i) => (i + 1) % slides.length); };

  const current = slides[index];

  if (!current) {
    return (
      <div className="relative mb-12 overflow-hidden rounded-[28px] bg-[#08080c] px-6 py-12 sm:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="space-y-4">
            <div className="h-5 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-white/10" />
            <div className="h-4 w-full max-w-sm animate-pulse rounded bg-white/10" />
            <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="aspect-[5/4] animate-pulse rounded-3xl bg-white/5" />
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
  const words = title.split(' ');

  return (
    <section
      className="dark relative mb-12 overflow-hidden rounded-[28px] bg-[#08080c] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient light */}
      <div className="tech-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[520px] w-[520px] -translate-y-1/2 animate-glow-pulse rounded-full bg-[radial-gradient(circle,hsl(252_100%_65%/0.55),transparent_65%)] blur-2xl" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,hsl(78_100%_58%/0.18),transparent_65%)] blur-2xl" />

      <div className="relative grid grid-cols-1 gap-4 px-5 pb-6 pt-6 sm:px-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-8 md:py-12 lg:px-14 lg:py-16">
        {/* Left: copy */}
        <div className="order-2 space-y-6 md:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_hsl(var(--neon))]" />
            {product.category || 'Nouveautés'}
          </span>

          <h1 className="text-[2.4rem] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-5xl lg:text-[4.25rem]">
            {words.map((word, i) => {
              const isLast = i === words.length - 1;
              return (
                <span key={i}>
                  {isLast ? (
                    <span className="bg-gradient-to-r from-[hsl(252_100%_75%)] to-neon bg-clip-text text-transparent">{word}</span>
                  ) : word}
                  {!isLast && ' '}
                </span>
              );
            })}
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-white/60 sm:text-base">{subtitle}</p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onQuickView?.(product)}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white pl-5 pr-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95"
            >
              Voir le produit
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </button>
            <button
              onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-white/[0.08]"
            >
              Catalogue
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs text-white/50">
            {PERKS.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-neon" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: product stage */}
        <div className="relative order-1 aspect-[5/4] w-full select-none md:order-2">
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
              {/* Lit stage frame */}
              <div className="absolute inset-[4%] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f4f4f7] via-[#e9e9ef] to-[#d9d9e2] shadow-[0_40px_80px_-30px_hsl(252_100%_60%/0.6)] ring-1 ring-white/20">
                <div className="absolute inset-x-[18%] bottom-[6%] h-[10%] rounded-[50%] bg-black/15 blur-xl" />
              {product.image_url ? (
                <img
                  src={cloudinaryImage(product.image_url, { width: 960 })}
                  srcSet={productImageSrcSet(product.image_url, [540, 720, 960, 1200])}
                  sizes="(min-width: 768px) 52vw, 100vw"
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`relative h-full w-full bg-transparent object-contain p-8 mix-blend-multiply ${
                    product.status === 'out_of_stock' ? 'opacity-60' : ''
                  }`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-black/25">
                  <Package className="h-14 w-14" />
                </div>
              )}
              </div>

              {/* Status/discount badges */}
              <div className="absolute left-[8%] top-[8%] z-10 flex flex-col gap-1.5">
                {product.status === 'out_of_stock' && (
                  <span className="rounded-full bg-orange-500 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
                    Rupture de stock
                  </span>
                )}
                {discount !== null && product.status !== 'out_of_stock' && (
                  <span className="rounded-full bg-neon px-2.5 py-1 font-mono text-[11px] font-bold text-neon-foreground shadow-[0_0_24px_hsl(var(--neon)/0.5)]">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Floating spec card */}
              <div className="glass-dark absolute bottom-0 right-0 z-10 w-[min(260px,70%)] rounded-2xl px-4 py-3 shadow-2xl">
                <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-white/50">
                  En vedette
                </p>
                <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-white">{product.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold leading-none text-white">
                    {product.price?.toLocaleString('fr-MA')}
                  </span>
                  <span className="text-[10px] font-semibold text-white/50">MAD</span>
                  {hasDiscount && (
                    <span className="ml-auto font-mono text-[11px] text-white/40 line-through">
                      {product.original_price?.toLocaleString('fr-MA')}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide controls */}
      {slides.length > 1 && (
        <div className="relative flex items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-3 sm:px-8 lg:px-14">
          <div className="flex flex-1 items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Diapositive ${i + 1}`}
                aria-current={i === index}
                className="relative h-1 max-w-16 flex-1 overflow-hidden rounded-full bg-white/15"
              >
                {i === index && (
                  <motion.span
                    key={`${index}-${paused}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    initial={{ width: paused ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                  />
                )}
                {i < index && <span className="absolute inset-0 rounded-full bg-white/50" />}
              </button>
            ))}
            <span className="ml-3 font-mono text-[11px] text-white/40">
              {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
              aria-label="Diapositive précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
              aria-label="Diapositive suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
