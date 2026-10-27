import { Heart, Home, LayoutGrid, Search, ShoppingCart } from 'lucide-react';

const FOCUS_SEARCH_EVENT = 'client-store-focus-search';

export default function MobileBottomNav({
  totalItems = 0,
  totalWishlist = 0,
  onCartOpen,
  onWishlistOpen,
  onCategoriesOpen,
}) {
  const focusSearch = () => window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="glass grid grid-cols-5 gap-1 rounded-[22px] px-1.5 py-1">
        <a href="/" className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <Home className="h-4 w-4" />
          Accueil
        </a>
        <button type="button" onClick={onCategoriesOpen} className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          Catégories
        </button>
        <button type="button" onClick={focusSearch} className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
            <Search className="h-4 w-4" />
          </span>
          Search
        </button>
        <button type="button" onClick={onWishlistOpen} className="relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <Heart className="h-4 w-4" />
          Favoris
          {totalWishlist > 0 && (
            <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {totalWishlist}
            </span>
          )}
        </button>
        <button type="button" onClick={onCartOpen} className="relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          Panier
          {totalItems > 0 && (
            <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 text-[9px] font-bold text-neon-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
