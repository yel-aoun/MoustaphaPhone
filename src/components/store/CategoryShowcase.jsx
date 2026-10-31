import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView, useReducedMotion } from 'framer-motion';
import { ChevronRight, Package, Pause, Play } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import { categoryLabel } from '@/lib/productCategories';
import { cloudinaryImage } from '@/lib/images';
import { slugify } from '@/lib/products';

function CategoryTile({ name, icon, count, covers }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.25 });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const Icon = ICON_COMPONENTS[icon] || Package;
  const signature = covers.map((p) => p.image_url).join('|');

  useEffect(() => { setIndex(0); }, [signature]);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (reduce || !inView || !visible || hovered || focused || paused || covers.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % covers.length), 5500);
    return () => clearInterval(timer);
  }, [reduce, inView, visible, hovered, focused, paused, covers.length]);

  return (
    <div ref={ref} className="relative min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <Link to={`/category/${slugify(name)}`}
        className="photo-well group flex h-[250px] flex-col overflow-hidden rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-[290px] sm:p-5">
        <span className="mb-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/80 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold leading-tight sm:text-lg">{categoryLabel(name)}</span>
        <span className="mt-1 text-xs text-muted-foreground dark:text-slate-600">{count} produit{count > 1 ? 's' : ''}</span>
        <div className="relative mt-3 min-h-0 flex-1" aria-hidden="true">
          {covers.length ? covers.map((cover, i) => (
            <img key={cover.image_url}
              src={cloudinaryImage(cover.image_url, { width: 400, height: 400, crop: 'pad', transform: true })}
              alt="" loading="lazy" decoding="async"
              className={`absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-700 motion-reduce:transition-none ${i === index % covers.length ? 'opacity-100' : 'opacity-0'}`} />
          )) : <Package className="absolute bottom-2 right-2 h-12 w-12 text-muted-foreground" />}
        </div>
      </Link>
      {covers.length > 1 && !reduce && (
        <button type="button" onClick={() => setPaused((value) => !value)}
          aria-label={`${paused ? 'Reprendre' : 'Suspendre'} le défilement des images : ${categoryLabel(name)}`} aria-pressed={paused}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-background dark:text-slate-600 dark:hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export default function CategoryShowcase({ products = [] }) {
  const { data: categories = [] } = useCategories();
  const tiles = useMemo(() => categories.map((category) => {
    const inCategory = products.filter((p) => p.category === category.name);
    const available = inCategory.filter((p) => p.image_url && p.status !== 'out_of_stock');
    const candidates = available.length ? available : inCategory.filter((p) => p.image_url);
    const seen = new Set();
    const covers = candidates.filter((p) => {
      if (seen.has(p.image_url)) return false;
      seen.add(p.image_url);
      return true;
    }).slice(0, 4);
    return { ...category, count: inCategory.length, covers };
  }).filter((tile) => tile.count > 0).slice(0, 8), [categories, products]);

  if (!tiles.length) return null;
  return (
    <section className="container-store pb-10 pt-8 sm:pb-12 sm:pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="section-title">Explorer par catégorie</h2>
        <Link to="/boutique" className="hidden min-h-11 items-center text-sm font-medium text-primary hover:underline sm:flex">
          Tout voir <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => <CategoryTile key={tile.name} {...tile} />)}
      </div>
    </section>
  );
}
