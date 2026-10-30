import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { DEFAULT_HERO_CONFIG } from '@/lib/heroStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { formatMoney, getProductPath } from '@/lib/products';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import TiltCard from '@/components/store/fx/TiltCard';
import CountUp from '@/components/store/fx/CountUp';

const SLIDE_MS = 6000;
const FALLBACK_CHIPS = ['100% original', 'Garantie', 'Livré en 24–72h'];
const CHIP_POSITIONS = [
  'left-0 top-[14%] sm:-left-4',
  'right-0 top-[30%] sm:-right-6',
  'left-[4%] bottom-[16%] sm:left-0',
];

function SignalBars() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[5, 8, 11, 14].map((h, i) => (
        <span key={h} className="w-[3px] rounded-sm bg-emerald-500 animate-blink" style={{ height: h * 0.85, animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}

function BatteryTimer({ running, slideKey }) {
  return (
    <span className="relative flex h-4 w-8 items-center rounded-[4px] border-[1.5px] border-current p-[2px]" aria-hidden="true">
      <span className="absolute -right-[4px] top-1/2 h-1.5 w-[3px] -translate-y-1/2 rounded-r-sm bg-current" />
      {/* CSS keyframes run on the compositor; a JS-driven fill kept the main thread busy every frame */}
      <span
        key={`${slideKey}-${running}`}
        className={`h-full w-full origin-left rounded-[2px] bg-emerald-500 ${running ? 'animate-battery-fill' : ''}`}
        style={running ? { animationDuration: `${SLIDE_MS}ms` } : undefined}
      />
    </span>
  );
}

export default function HeroSlider({ products = [], heroConfig, totalProducts = 0 }) {
  const cfg = heroConfig ?? DEFAULT_HERO_CONFIG;
  const reduce = useReducedMotion();

  const slides = useMemo(() => {
    if (cfg.slides && cfg.slides.length > 0) {
      const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
      return cfg.slides.map((s) => productMap[s.productId]).filter(Boolean).slice(0, 5);
    }
    return products.slice(0, 5);
  }, [cfg, products]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Autoplay only while the hero is on screen, so scrolling past it lets the phone rest
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.2 });
  const autoplay = !paused && inView;

  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2 || !autoplay) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, autoplay]);

  const product = slides[index];
  const title = cfg.defaultTitle || DEFAULT_HERO_CONFIG.defaultTitle;
  const subtitle = cfg.defaultSubtitle || DEFAULT_HERO_CONFIG.defaultSubtitle;
  const words = title.split(' ');
  const specChips = (Array.isArray(product?.specs) ? product.specs : [])
    .filter((spec) => spec?.value)
    .slice(0, 3)
    .map((spec) => spec.value);
  const chips = specChips.length >= 2 ? specChips : FALLBACK_CHIPS;
  const go = (dir) => setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-secondary">
      <CircuitBackground className="text-foreground [mask-image:linear-gradient(90deg,transparent_30%,#000_70%)] max-lg:[mask-image:linear-gradient(180deg,#000_30%,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.16),transparent_65%)]" />
      {/* Slow aurora glows */}
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 animate-aurora rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/10" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-96 animate-aurora rounded-full bg-indigo-300/20 blur-3xl [animation-delay:-9s] dark:bg-indigo-500/10" />

      <div className="container-store relative grid items-center gap-8 pb-12 pt-24 sm:pt-28 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:pb-16">
        {/* Copy */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
            <SignalBars />
            Stock en direct · {totalProducts} produits disponibles
          </span>
          <h1 className="mt-5 text-[2.4rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-[4.1rem]">
            {words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                className="inline-block"
                initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
              >
                {i === words.length - 1 ? (
                  <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">{word}</span>
                ) : word}
                {i < words.length - 1 && ' '}
              </motion.span>
            ))}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">{subtitle}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              to="/boutique"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary pl-6 pr-2 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5"
            >
              Découvrir la boutique
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/boutique?sale=1" className="inline-flex h-12 items-center rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground">
              Voir les offres
            </Link>
          </div>

          <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6 lg:mx-0">
            {[
              [<CountUp key="p" to={totalProducts} />, 'produits'],
              [<CountUp key="d" to={72} suffix="h" />, 'livraison max'],
              [<CountUp key="r" to={7} suffix=" j" />, 'pour changer d’avis'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</dt>
                <dd className="mt-0.5 text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product stage */}
        <div
          className="relative order-1 mx-auto aspect-square w-full max-w-[460px] lg:order-2 lg:max-w-[540px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute inset-[3%] animate-spin-slow rounded-full border border-dashed border-foreground/15" />
          <div className="absolute inset-[12%] animate-spin-slower rounded-full border border-foreground/10">
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]" />
          </div>
          <div className="absolute inset-[3%] animate-spin-slow rounded-full" style={{ animationDuration: '14s' }}>
            <span className="absolute left-[6%] top-[22%] h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_12px_theme(colors.sky.500)]" />
          </div>

          {!product ? (
            <div className="absolute inset-[18%] animate-pulse rounded-full bg-background/70" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                className="absolute inset-[18%]"
                initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="group h-full rounded-full" max={12}>
                  <Link
                    to={getProductPath(product)}
                    aria-label={product.name}
                    className="photo-well relative block h-full overflow-hidden rounded-full shadow-[0_40px_80px_-40px_hsl(var(--primary)/0.6)] ring-1 ring-foreground/5"
                  >
                    <span className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
                    {product.image_url ? (
                      <img
                        src={cloudinaryImage(product.image_url, { width: 900 })}
                        srcSet={productImageSrcSet(product.image_url, [480, 720, 960])}
                        sizes="(min-width: 1024px) 380px, 70vw"
                        alt={product.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className={`relative h-full w-full bg-transparent object-contain p-[16%] mix-blend-multiply ${reduce ? '' : 'animate-float'}`}
                      />
                    ) : (
                      <Package className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    )}
                  </Link>
                </TiltCard>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Floating spec chips */}
          {product && chips.map((chip, i) => (
            <motion.span
              key={`${product.id}-${chip}`}
              className={`absolute ${CHIP_POSITIONS[i]} z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-soft backdrop-blur`}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.12, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-blink" style={{ animationDelay: `${i * 0.4}s` }} />
              {chip}
            </motion.span>
          ))}

          {/* Now-showing card */}
          {product && (
            <div className="absolute bottom-0 right-0 z-10 flex items-center gap-3 rounded-2xl border border-border bg-background/90 p-2.5 pl-4 shadow-soft backdrop-blur sm:-right-2">
              <div className="min-w-0">
                <p className="max-w-[150px] truncate text-xs font-medium text-foreground sm:max-w-[190px]">{product.name}</p>
                <p className="text-sm font-semibold text-foreground">{formatMoney(product.price)}</p>
              </div>
              {slides.length > 1 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <button type="button" onClick={() => go(-1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary" aria-label="Produit précédent">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <BatteryTimer running={autoplay && !reduce} slideKey={index} />
                  <button type="button" onClick={() => go(1)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary" aria-label="Produit suivant">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
