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

  // Repeat the list so the marquee track is always wider than the screen
  const track = Array.from({ length: Math.max(2, Math.ceil(10 / brands.length)) }).flatMap(() => brands);

  return (
    <section className="pb-14 sm:pb-20">
      <h2 className="section-title container-store mb-6">Nos marques</h2>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="pause-on-hover flex w-max animate-marquee gap-3" style={{ animationDuration: `${track.length * 3}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1}>
              {track.map(({ name, count, query }, i) => (
                <Link
                  key={`${copy}-${name}-${i}`}
                  to={`/boutique?q=${encodeURIComponent(query)}`}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="group flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-background px-6 py-4 transition-colors hover:border-primary"
                >
                  <span className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">{name}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{count}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
