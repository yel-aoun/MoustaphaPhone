import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import MobileBottomNav from '@/components/store/MobileBottomNav';
import WishlistSidebar from '@/components/store/WishlistSidebar';
import WhatsAppFloat from '@/components/store/WhatsAppFloat';
import ComparePanel from '@/components/store/ComparePanel';
import CartIsland from '@/components/store/CartIsland';
import PromotionStrip from '@/components/store/PromotionStrip';
import { storagePrefix } from '@/lib/brand';

const PROMO_DISMISSED_KEY = `${storagePrefix}_promotion_dismissed_v1`;

export function useStoreProducts() {
  const query = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const products = query.data || [];
  return { ...query, products, activeProducts: products.filter((p) => p.status !== 'inactive') };
}

// Shared shell for every storefront page: header, footer, mobile tab bar and global drawers.
export default function StoreLayout({ children, hideTabBar = false, hideWhatsApp = false, overlapHeader = false }) {
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const { activeProducts } = useStoreProducts();
  const { cart, addToCart, totalPrice } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [promoDismissed, setPromoDismissed] = useState(() => {
    try { return sessionStorage.getItem(PROMO_DISMISSED_KEY) === '1'; } catch { return false; }
  });
  const maxDiscount = activeProducts.reduce((max, product) => {
    const original = Number(product.original_price);
    const price = Number(product.price);
    if (product.status === 'out_of_stock' || !Number.isFinite(original) || !Number.isFinite(price) || original <= 0 || price < 0 || price >= original) return max;
    return Math.max(max, Math.floor(((original - price) / original) * 100));
  }, 0);
  const showPromotion = !promoDismissed && maxDiscount > 0;
  const dismissPromotion = () => {
    setPromoDismissed(true);
    try { sessionStorage.setItem(PROMO_DISMISSED_KEY, '1'); } catch { /* Dismiss for this visit when storage is unavailable. */ }
  };

  return (
    <div className={`flex min-h-screen flex-col bg-background ${showPromotion ? 'pt-11' : ''}`}>
      {showPromotion && <PromotionStrip discount={maxDiscount} onDismiss={dismissPromotion} />}
      <Header promotionVisible={showPromotion} products={activeProducts} onWishlistOpen={() => setWishlistOpen(true)} />
      <motion.main
        key={pathname}
        // Opacity only: a transform here would break position:fixed bars inside pages
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`flex-1 ${overlapHeader ? '' : 'pt-[76px]'} ${hideTabBar ? 'pb-28 md:pb-0' : 'pb-24 md:pb-0'}`}
      >
        {children}
      </motion.main>
      <Footer />

      {!hideTabBar && <MobileBottomNav onWishlistOpen={() => setWishlistOpen(true)} />}
      {!hideWhatsApp && <WhatsAppFloat cart={cart} totalPrice={totalPrice} />}
      <ComparePanel products={activeProducts} />
      <CartIsland />
      <WishlistSidebar
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={removeFromWishlist}
        onAddToCart={addToCart}
      />
    </div>
  );
}
