import { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import { RECENT_UPDATED_EVENT, getRecentlyViewedIds } from '@/lib/recentStore';

export default function RecentlyViewedSection({
  products = [],
  currentProductId = null,
  onAddToCart,
  onQuickView,
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
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-xl font-extrabold tracking-normal text-foreground">Consultés récemment</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Retour rapide aux produits que vous avez ouverts.</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {recentProducts.map((product) => (
          <div key={product.id} className="w-[72vw] max-w-[240px] shrink-0 sm:w-[220px]">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
