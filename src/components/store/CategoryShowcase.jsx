import { useMemo } from 'react';
import { ArrowUpRight, Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import { cloudinaryImage } from '@/lib/images';

export default function CategoryShowcase({ products = [], onSelect }) {
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
    <section className="mb-14">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="section-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Explorer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Shop par catégorie</h2>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {tiles.map(({ name, icon, count, cover }, i) => {
          const Icon = icon ? ICON_COMPONENTS[icon] : null;
          const featured = i === 0 && tiles.length >= 4;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect?.(name)}
              className={`group relative aspect-[4/5] w-40 shrink-0 lg:aspect-square snap-start overflow-hidden rounded-3xl border border-border bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.45)] sm:w-auto ${
                featured ? 'lg:col-span-2 lg:row-span-2 lg:aspect-auto' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 to-secondary dark:from-[hsl(240_6%_92%)] dark:to-[hsl(240_6%_84%)]" />
              {cover ? (
                <img
                  src={cloudinaryImage(cover.image_url, { width: featured ? 720 : 420, height: featured ? 720 : 420, crop: 'pad' })}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full bg-transparent object-contain p-6 pb-16 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Package className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />
              )}

              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-2xl border border-foreground/[0.06] bg-background/80 px-3 py-2.5 backdrop-blur-md">
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    {count} produit{count > 1 ? 's' : ''}
                  </span>
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
