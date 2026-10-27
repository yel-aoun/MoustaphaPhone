import { useMemo } from 'react';
import { Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import { cloudinaryImage } from '@/lib/images';

export default function CategoryShowcase({ products = [], onSelect }) {
  const { data: categories = [] } = useCategories();

  const bubbles = useMemo(() => {
    return categories
      .map((category) => {
        const inCategory = products.filter((p) => p.category === category.name);
        const cover = inCategory.find((p) => p.image_url && p.status !== 'out_of_stock') || inCategory.find((p) => p.image_url);
        return { ...category, count: inCategory.length, cover };
      })
      .filter((bubble) => bubble.count > 0);
  }, [categories, products]);

  if (bubbles.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="section-title mb-5">Nos rayons</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:gap-6 sm:px-0">
        {bubbles.map(({ name, icon, count, cover }) => {
          const Icon = icon ? ICON_COMPONENTS[icon] : null;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect?.(name)}
              className="group flex w-[92px] shrink-0 flex-col items-center gap-2 text-center sm:w-[110px]"
            >
              <span className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full bg-surface ring-2 ring-transparent ring-offset-2 ring-offset-background transition-all group-hover:ring-primary sm:h-[104px] sm:w-[104px]">
                {cover ? (
                  <img
                    src={cloudinaryImage(cover.image_url, { width: 240, height: 240, crop: 'pad' })}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full rounded-full bg-transparent object-contain p-3 mix-blend-multiply transition-transform duration-300 group-hover:scale-110 dark:mix-blend-normal"
                  />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                )}
                {Icon && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
              <span className="w-full truncate text-xs font-bold text-foreground group-hover:text-primary sm:text-[13px]">{name}</span>
              <span className="-mt-1.5 text-[11px] font-medium text-muted-foreground">{count} article{count > 1 ? 's' : ''}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
