import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { slugify } from '@/lib/products';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import BrandLogo from '@/components/brand/BrandLogo';
import SpotlightSearch from '@/components/store/SpotlightSearch';

export const OPEN_SEARCH_EVENT = 'client-store-open-search';

const NAV = [
  { to: '/', label: 'Accueil', match: (path, search) => path === '/' },
  { to: '/boutique', label: 'Boutique', match: (path, search) => (path === '/boutique' || path.startsWith('/category/')) && !search.includes('sale=1') },
  { to: '/boutique?sale=1', label: 'Promotions', dot: true, match: (path, search) => search.includes('sale=1') },
  { to: '/track-order', label: 'Suivi', match: (path) => path === '/track-order' },
];

export default function Header({ products = [], onWishlistOpen }) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { data: categories = [] } = useCategories();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const open = () => setSearchOpen(true);
    const onKey = (event) => {
      const typing = /input|textarea|select/i.test(event.target?.tagName || '') || event.target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((v) => !v);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, open);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close overlays whenever the route changes
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const iconButton = 'relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06]';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div
          className={`liquid-glass mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 rounded-full pl-4 pr-2 transition-all duration-300 ${
            scrolled ? 'sm:max-w-[1000px]' : ''
          }`}
        >
          <div className="flex min-w-0 items-center gap-1">
            <button type="button" onClick={() => setMenuOpen(true)} className={`${iconButton} -ml-2 md:hidden`} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" aria-label="Accueil" className="min-w-0">
              <BrandLogo size="sm" />
            </Link>
          </div>

          <nav className="hidden items-center rounded-full p-1 md:flex">
            {NAV.map(({ to, label, dot, match }) => {
              const active = match(location.pathname, location.search);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${active ? 'text-background' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-foreground"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {dot && <span className="h-1.5 w-1.5 animate-blink rounded-full bg-deal" />}
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full bg-foreground/[0.05] pl-3.5 pr-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.09] lg:flex"
              aria-label="Rechercher"
            >
              <Search className="h-4 w-4" />
              <span className="pr-6">Rechercher</span>
              <kbd className="rounded-md border border-foreground/10 bg-background/70 px-1.5 py-0.5 text-[10px] font-medium">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} className={`${iconButton} lg:hidden`} aria-label="Rechercher">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={toggleTheme} className={`${iconButton} hidden sm:flex`} aria-label="Changer le thème">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={isDark ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
            <button type="button" onClick={onWishlistOpen} className={`${iconButton} hidden sm:flex`} aria-label="Mes favoris">
              <Heart className="h-[18px] w-[18px]" />
              {totalWishlist > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
            </button>
            <Link to="/panier" className="relative flex h-10 items-center gap-2 rounded-full bg-foreground pl-3 pr-3.5 text-background transition-transform hover:scale-[1.03] active:scale-95" aria-label="Panier">
              <ShoppingBag className="h-4 w-4" />
              <motion.span
                key={totalItems}
                initial={{ scale: 1.7 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                className="text-xs font-semibold tabular-nums"
              >
                {totalItems}
              </motion.span>
            </Link>
          </div>
        </div>
      </header>

      <SpotlightSearch open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />

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
