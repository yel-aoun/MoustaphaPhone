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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_-12px_rgba(20,20,40,0.2)] sm:hidden">
      <div className="grid grid-cols-5 gap-1">
        <a href="/" className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-bold text-primary">
          <Home className="h-4 w-4" />
          Accueil
        </a>
        <button type="button" onClick={onCategoriesOpen} className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <LayoutGrid className="h-4 w-4" />
          Catégories
        </button>
        <button type="button" onClick={focusSearch} className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-primary">
          <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md">
            <Search className="h-4 w-4" />
          </span>
          Recherche
        </button>
        <button type="button" onClick={onWishlistOpen} className="relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <Heart className="h-4 w-4" />
          Favoris
          {totalWishlist > 0 && (
            <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {totalWishlist}
            </span>
          )}
        </button>
        <button type="button" onClick={onCartOpen} className="relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          Panier
          {totalItems > 0 && (
            <span className="absolute right-4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[9px] font-extrabold text-deal-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
