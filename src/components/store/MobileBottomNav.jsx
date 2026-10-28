import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { OPEN_SEARCH_EVENT } from '@/components/store/Header';

export default function MobileBottomNav({ onWishlistOpen }) {
  const { pathname } = useLocation();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const tabs = [
    { key: 'home', label: 'Accueil', icon: Home, to: '/', active: pathname === '/' },
    { key: 'shop', label: 'Boutique', icon: LayoutGrid, to: '/boutique', active: pathname === '/boutique' || pathname.startsWith('/category/') },
    { key: 'search', label: 'Recherche', icon: Search, onClick: () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT)) },
    { key: 'fav', label: 'Favoris', icon: Heart, onClick: onWishlistOpen, badge: totalWishlist > 0 ? '' : null },
    { key: 'cart', label: 'Panier', icon: ShoppingBag, to: '/panier', active: pathname === '/panier', badge: totalItems > 0 ? totalItems : null },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="liquid-glass grid grid-cols-5 rounded-[26px] p-1.5">
        {tabs.map(({ key, label, icon: Icon, to, onClick, active, badge }) => {
          const content = (
            <>
              {active && (
                <motion.span
                  layoutId="tab-bubble"
                  className="absolute inset-0 rounded-[20px] bg-foreground"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
                {badge !== null && badge !== undefined && (
                  <span className={`absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold ${
                    badge === '' ? 'h-2 w-2 min-w-0 bg-primary p-0' : 'h-4 bg-primary text-primary-foreground'
                  }`}>
                    {badge}
                  </span>
                )}
              </span>
              <span className="relative text-[10px] font-medium">{label}</span>
            </>
          );
          const className = `relative flex flex-col items-center gap-0.5 rounded-[20px] py-1.5 transition-colors ${
            active ? 'text-background' : 'text-muted-foreground'
          }`;
          return to ? (
            <Link key={key} to={to} className={className} aria-current={active ? 'page' : undefined}>{content}</Link>
          ) : (
            <button key={key} type="button" onClick={onClick} className={className}>{content}</button>
          );
        })}
      </div>
    </nav>
  );
}
