import { NavLink } from 'react-router-dom';
import { Heart, Home, LayoutGrid, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { OPEN_SEARCH_EVENT } from '@/components/store/Header';

const itemClass = (active) =>
  `relative flex min-w-0 flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
    active ? 'text-foreground' : 'text-muted-foreground'
  }`;

export default function MobileBottomNav({ onWishlistOpen }) {
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const openSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5">
        <NavLink to="/" end className={({ isActive }) => itemClass(isActive)}>
          <Home className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Accueil
        </NavLink>
        <NavLink to="/boutique" className={({ isActive }) => itemClass(isActive)}>
          <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Boutique
        </NavLink>
        <button type="button" onClick={openSearch} className={itemClass(false)}>
          <Search className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Recherche
        </button>
        <button type="button" onClick={onWishlistOpen} className={itemClass(false)}>
          <Heart className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Favoris
          {totalWishlist > 0 && <span className="absolute right-[30%] top-1 h-2 w-2 rounded-full bg-primary" />}
        </button>
        <NavLink to="/panier" className={({ isActive }) => itemClass(isActive)}>
          <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.75} />
          Panier
          {totalItems > 0 && (
            <span className="absolute right-[24%] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-semibold text-background">
              {totalItems}
            </span>
          )}
        </NavLink>
      </div>
    </nav>
  );
}
