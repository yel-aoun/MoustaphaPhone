import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Package } from 'lucide-react';
import { DEFAULT_HERO_CONFIG } from '@/lib/heroStore';
import { cloudinaryImage, productImageSrcSet } from '@/lib/images';
import { formatMoney, getProductPath } from '@/lib/products';

const SLIDE_MS = 5000;

export default function HeroSlider({ products = [], heroConfig }) {
  const cfg = heroConfig ?? DEFAULT_HERO_CONFIG;

  const slides = useMemo(() => {
    if (cfg.slides && cfg.slides.length > 0) {
      const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
      return cfg.slides.map((s) => productMap[s.productId]).filter(Boolean).slice(0, 5);
    }
    return products.slice(0, 5);
  }, [cfg, products]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const product = slides[index];
  const title = cfg.defaultTitle || DEFAULT_HERO_CONFIG.defaultTitle;
  const subtitle = cfg.defaultSubtitle || DEFAULT_HERO_CONFIG.defaultSubtitle;

  return (
    <section
      className="overflow-hidden bg-secondary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-store flex flex-col items-center pb-10 pt-12 text-center sm:pt-16">
        <h1 className="max-w-3xl text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/boutique"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Découvrir la boutique
          </Link>
          {product && (
            <Link
              to={getProductPath(product)}
              className="inline-flex h-11 items-center gap-0.5 px-3 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Voir {product.name.split(' ').slice(0, 3).join(' ')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Product stage */}
        <div className="relative mt-8 h-[300px] w-full max-w-3xl dark:rounded-3xl dark:bg-[hsl(240_5%_90%)] sm:mt-10 sm:h-[420px]">
          {!product ? (
            <div className="mx-auto h-full w-2/3 animate-pulse rounded-3xl bg-background/60" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Link to={getProductPath(product)} className="block h-full" aria-label={product.name}>
                  {product.image_url ? (
                    <img
                      src={cloudinaryImage(product.image_url, { width: 1100 })}
                      srcSet={productImageSrcSet(product.image_url, [600, 900, 1200])}
                      sizes="(min-width: 768px) 768px, 100vw"
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="h-full w-full bg-transparent object-contain mix-blend-multiply"
                    />
                  ) : (
                    <Package className="mx-auto mt-24 h-16 w-16 text-muted-foreground/40" />
                  )}
                </Link>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {product && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{product.name}</span>
              <span className="mx-2">·</span>
              {formatMoney(product.price)}
            </p>
            {slides.length > 1 && (
              <div className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-2">
                {slides.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Afficher ${item.name}`}
                    aria-current={i === index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index ? 'w-5 bg-foreground' : 'w-2 bg-foreground/25 hover:bg-foreground/45'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
