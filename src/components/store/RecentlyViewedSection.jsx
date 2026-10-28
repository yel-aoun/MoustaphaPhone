import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/store/ProductCard';
import { RECENT_UPDATED_EVENT, getRecentlyViewedIds } from '@/lib/recentStore';

export default function RecentlyViewedSection({
  products = [],
  currentProductId = null,
  onAddToCart,
}) {
  const [ids, setIds] = useState(() => getRecentlyViewedIds());

  useEffect(() => {
    const sync = () => setIds(getRecentlyViewedIds());
    window.addEventListener(RECENT_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(RECENT_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const recentProducts = useMemo(() => {
    return ids
      .filter((id) => id !== currentProductId)
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [currentProductId, ids, products]);

  if (recentProducts.length === 0) return null;

  return (
    <section className="pb-14 sm:pb-20">
      <h2 className="section-title mb-6">Consultés récemment</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {recentProducts.map((product) => (
          <div key={product.id} className="w-[46vw] max-w-[220px] shrink-0 sm:w-[200px]">
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  );
}
