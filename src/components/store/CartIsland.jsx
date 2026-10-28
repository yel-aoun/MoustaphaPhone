import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Package } from 'lucide-react';
import { cloudinaryImage } from '@/lib/images';
import { formatMoney } from '@/lib/products';

const ISLAND_EVENT = 'client-store-cart-island';

// Call after adding to the cart: shows the "Dynamic Island" confirmation
export function showCartIsland(product, quantity = 1) {
  window.dispatchEvent(new CustomEvent(ISLAND_EVENT, {
    detail: { name: product?.name, image_url: product?.image_url, price: product?.price, quantity },
  }));
}

export default function CartIsland() {
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const onAdd = (event) => {
      clear();
      setItem({ ...event.detail, key: Date.now() });
      setExpanded(false);
      timers.current.push(setTimeout(() => setExpanded(true), 120));
      timers.current.push(setTimeout(() => setExpanded(false), 3200));
      timers.current.push(setTimeout(() => setItem(null), 3700));
    };
    window.addEventListener(ISLAND_EVENT, onAdd);
    return () => { clear(); window.removeEventListener(ISLAND_EVENT, onAdd); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[80] flex justify-center px-3">
      <AnimatePresence>
        {item && (
          <motion.div
            key="island"
            layout
            initial={{ opacity: 0, y: -20, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            style={{ borderRadius: 32 }}
            className="pointer-events-auto overflow-hidden bg-black text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
            onMouseEnter={() => { timers.current.forEach(clearTimeout); timers.current = []; setExpanded(true); }}
            onMouseLeave={() => {
              timers.current.push(setTimeout(() => setExpanded(false), 1200));
              timers.current.push(setTimeout(() => setItem(null), 1700));
            }}
          >
            {expanded ? (
              <motion.div layout key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-[min(92vw,380px)] items-center gap-3 p-2.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  {item.image_url ? (
                    <img src={cloudinaryImage(item.image_url, { width: 120, height: 120, crop: 'pad' })} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Package className="h-5 w-5 text-black/40" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <Check className="h-3 w-3" /> Ajouté au panier{item.quantity > 1 ? ` · ×${item.quantity}` : ''}
                  </p>
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-white/60">{formatMoney(item.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setItem(null); navigate('/panier'); }}
                  className="h-9 shrink-0 rounded-full bg-white px-4 text-xs font-semibold text-black transition-transform active:scale-95"
                >
                  Voir
                </button>
              </motion.div>
            ) : (
              <motion.div layout key="closed" className="flex h-9 w-36 items-center justify-between px-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="h-4 w-4 rounded-full bg-white/10" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
