import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
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
        {tiles.map(({ name, count, cover }) => (
          <Link
            key={name}
            to={`/category/${slugify(name)}`}
            className="photo-well group relative flex aspect-square flex-col overflow-hidden rounded-2xl p-4 transition-opacity hover:opacity-90 sm:aspect-[4/3.4] sm:p-5"
          >
            <span className="relative z-10 text-base font-semibold sm:text-lg">{name}</span>
            <span className="relative z-10 text-xs opacity-60">{count} produit{count > 1 ? 's' : ''}</span>
            {cover ? (
              <img
                src={cloudinaryImage(cover.image_url, { width: 400, height: 400, crop: 'pad' })}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute bottom-0 right-0 h-[68%] w-[68%] bg-transparent object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <Package className="absolute bottom-5 right-5 h-10 w-10 text-muted-foreground/30" />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
