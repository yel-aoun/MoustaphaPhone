import { useMemo } from 'react';
import { Link } from 'react-router-dom';

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

export default function BrandStrip({ products = [] }) {
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
    <section className="container-store pb-14 sm:pb-20">
      <h2 className="section-title mb-6">Nos marques</h2>
      <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {brands.map(({ name, count, query }) => (
          <Link
            key={name}
            to={`/boutique?q=${encodeURIComponent(query)}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
          >
            {name}
            <span className="text-xs text-muted-foreground">{count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
