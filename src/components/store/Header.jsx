import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { slugify } from '@/lib/products';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import BrandLogo from '@/components/brand/BrandLogo';
import SearchSuggestions from '@/components/store/SearchSuggestions';

export const OPEN_SEARCH_EVENT = 'client-store-open-search';

const navLinkClass = ({ isActive }) =>
  `text-[13px] font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`;

export default function Header({ products = [], onWishlistOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { data: categories = [] } = useCategories();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  // Close overlays whenever the route changes
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!searchOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/boutique?q=${encodeURIComponent(value)}` : '/boutique');
    setQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="container-store flex h-14 items-center justify-between gap-4 sm:h-16">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" aria-label="Accueil" className="min-w-0">
              <BrandLogo size="sm" />
            </Link>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            <NavLink to="/" end className={navLinkClass}>Accueil</NavLink>
            <NavLink to="/boutique" end className={({ isActive }) => navLinkClass({ isActive: isActive && !location.search.includes('sale=1') })}>Boutique</NavLink>
            <Link to="/boutique?sale=1" className={navLinkClass({ isActive: location.search.includes('sale=1') })}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-deal" />
                Promotions
              </span>
            </Link>
            <NavLink to="/track-order" className={navLinkClass}>Suivi de commande</NavLink>
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
              aria-label="Rechercher"
            >
              {searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:flex"
              aria-label="Changer le thème"
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button
              type="button"
              onClick={onWishlistOpen}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:flex"
              aria-label="Mes favoris"
            >
              <Heart className="h-[18px] w-[18px]" />
              {totalWishlist > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <Link
              to="/panier"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
              aria-label="Panier"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 1.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                  className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </div>
        </div>

        {/* Search panel */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="border-t border-border/70 bg-background"
            >
              <form onSubmit={submitSearch} className="container-store py-4">
                <div className="relative mx-auto max-w-2xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher un téléphone, une coque, un chargeur…"
                    className="h-12 w-full rounded-full bg-secondary pl-12 pr-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                  />
                  <SearchSuggestions
                    query={query}
                    products={products}
                    onCategorySelect={(category) => navigate(`/category/${slugify(category)}`)}
                    onSelect={() => setSearchOpen(false)}
                  />
                </div>
                {query.trim().length < 2 && categories.length > 0 && (
                  <div className="mx-auto mt-3 flex max-w-2xl flex-wrap gap-2">
                    <span className="py-1 text-xs text-muted-foreground">Populaire :</span>
                    {categories.slice(0, 6).map(({ name }) => (
                      <Link
                        key={name}
                        to={`/category/${slugify(name)}`}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {name}
                      </Link>
                    ))}
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-background md:hidden"
          >
            <div className="container-store flex h-14 items-center justify-between">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container-store flex flex-col pb-10 pt-4">
              {[
                ['/', 'Accueil'],
                ['/boutique', 'Toute la boutique'],
                ['/boutique?sale=1', 'Promotions'],
                ['/track-order', 'Suivre ma commande'],
              ].map(([to, label], i) => (
                <motion.div key={to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link to={to} className="block border-b border-border py-4 text-2xl font-semibold tracking-tight text-foreground">
                    {label}
                  </Link>
                </motion.div>
              ))}
              {categories.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {categories.map(({ name, icon }) => {
                    const Icon = icon ? ICON_COMPONENTS[icon] : null;
                    return (
                      <Link key={name} to={`/category/${slugify(name)}`} className="flex flex-col items-center gap-2 rounded-2xl bg-secondary px-2 py-4 text-center text-xs font-medium text-foreground">
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                        <span className="w-full truncate">{name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Mode clair' : 'Mode sombre'}
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
