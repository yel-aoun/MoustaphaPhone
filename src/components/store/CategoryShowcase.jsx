import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import Reveal from '@/components/store/fx/Reveal';
import { cloudinaryImage } from '@/lib/images';
import { slugify } from '@/lib/products';

export default function CategoryShowcase({ products = [] }) {
  const { data: categories = [] } = useCategories();

  const tiles = useMemo(() => {
    return categories
      .map((category) => {
        const inCategory = products.filter((p) => p.category === category.name);
        const cover = inCategory.find((p) => p.image_url && p.status !== 'out_of_stock') || inCategory.find((p) => p.image_url);
        return { ...category, count: inCategory.length, cover };
      })
      .filter((tile) => tile.count > 0)
      .slice(0, 8);
  }, [categories, products]);

  if (tiles.length === 0) return null;

  return (
    <section className="container-store py-14 sm:py-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="section-title">Explorer par catégorie</h2>
        <Link to="/boutique" className="hidden items-center text-sm font-medium text-primary hover:underline sm:flex">
          Tout voir <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {tiles.map(({ name, icon, count, cover }, i) => {
          const Icon = icon ? ICON_COMPONENTS[icon] : null;
          return (
            <Reveal key={name} delay={i * 0.05}>
              <Link
                to={`/category/${slugify(name)}`}
                className="photo-well group relative flex aspect-square flex-col overflow-hidden rounded-2xl p-4 sm:aspect-[4/3.4] sm:p-5"
              >
                {/* Scan line + corner trace on hover */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-primary/15 to-transparent opacity-0 group-hover:animate-scan group-hover:opacity-100" />
                <svg className="pointer-events-none absolute right-3 top-3 h-10 w-10 text-primary opacity-30 transition-opacity group-hover:opacity-80" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M2 2 H22 L30 10 V38" />
                  <circle cx="30" cy="38" r="2" fill="currentColor" />
                  <circle cx="2" cy="2" r="2" fill="currentColor" />
                </svg>
                {Icon && (
                  <span className="relative z-10 mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-background/70 text-primary shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                <span className="relative z-10 text-base font-semibold sm:text-lg">{name}</span>
                <span className="relative z-10 text-xs opacity-60">{count} produit{count > 1 ? 's' : ''}</span>
                {cover ? (
                  <img
                    src={cloudinaryImage(cover.image_url, { width: 400, height: 400, crop: 'pad' })}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute -bottom-2 -right-2 h-[62%] w-[62%] bg-transparent object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110 group-hover:-rotate-6"
                  />
                ) : (
                  <Package className="absolute bottom-5 right-5 h-10 w-10 opacity-20" />
                )}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
