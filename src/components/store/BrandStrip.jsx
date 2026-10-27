import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

// Brands are detected from product names; each keyword is something customers search for.
const BRANDS = [
  { name: 'Apple', keywords: ['iphone', 'airpods', 'ipad', 'apple', 'magsafe', 'macbook'] },
  { name: 'Samsung', keywords: ['samsung', 'galaxy'] },
  { name: 'Xiaomi', keywords: ['xiaomi', 'redmi', 'poco'] },
  { name: 'Google', keywords: ['pixel', 'google'] },
  { name: 'Oppo', keywords: ['oppo'] },
  { name: 'Realme', keywords: ['realme'] },
  { name: 'Honor', keywords: ['honor'] },
  { name: 'Huawei', keywords: ['huawei'] },
  { name: 'Infinix', keywords: ['infinix'] },
  { name: 'Tecno', keywords: ['tecno'] },
  { name: 'OnePlus', keywords: ['oneplus'] },
  { name: 'Sony', keywords: ['sony'] },
  { name: 'JBL', keywords: ['jbl'] },
  { name: 'Anker', keywords: ['anker'] },
];

export default function BrandStrip({ products = [], onSearch }) {
  const brands = useMemo(() => {
    const names = products.map((p) => (p.name || '').toLowerCase());
    return BRANDS.map((brand) => {
      // Search with the keyword that matches the most products for this brand
      const ranked = brand.keywords
        .map((keyword) => ({ keyword, hits: names.filter((n) => n.includes(keyword)).length }))
        .sort((a, b) => b.hits - a.hits);
      const count = names.filter((n) => brand.keywords.some((k) => n.includes(k))).length;
      return { ...brand, count, query: ranked[0]?.keyword };
    }).filter((brand) => brand.count > 0);
  }, [products]);

  if (brands.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="section-title mb-5">Shop par marque</h2>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-6">
        {brands.map(({ name, count, query }) => (
          <button
            key={name}
            type="button"
            onClick={() => onSearch?.(query)}
            className="group flex min-w-[140px] items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-all hover:border-primary hover:shadow-soft sm:min-w-0"
          >
            <span>
              <span className="block text-base font-extrabold tracking-tight text-foreground group-hover:text-primary">{name}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{count} produit{count > 1 ? 's' : ''}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </section>
  );
}
