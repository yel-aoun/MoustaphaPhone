import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart, Search, X, Truck, RotateCcw, Shield, Heart,
  Sun, Moon, ChevronDown, ChevronRight, LayoutGrid, Package, Menu,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import BrandLogo from '@/components/brand/BrandLogo';
import { cloudinaryImage } from '@/lib/images';
import SearchSuggestions from '@/components/store/SearchSuggestions';

const ANNOUNCEMENT_MESSAGES = [
  { icon: Truck,     text: 'Livraison gratuite à partir de 500 MAD' },
  { icon: Shield,    text: 'Paiement à la livraison — cash à la réception' },
  { icon: RotateCcw, text: 'Retours acceptés sous 7 jours' },
];
const FOCUS_SEARCH_EVENT = 'client-store-focus-search';

export default function Header({
  totalItems, onCartOpen,
  totalWishlist, onWishlistOpen,
  searchQuery, onSearchChange,
  activeCategory, onCategorySelect,
  products = [],
}) {
  const [scrolled, setScrolled] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaHovered, setMegaHovered] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const catDropdownRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const megaAreaRef = useRef(null);
  const closeTimer = useRef(null);

  const { isDark, toggleTheme } = useTheme();
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % ANNOUNCEMENT_MESSAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const focusSearch = () => {
      const input = window.matchMedia('(min-width: 640px)').matches
        ? desktopSearchRef.current
        : mobileSearchRef.current;
      input?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener(FOCUS_SEARCH_EVENT, focusSearch);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focusSearch);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };

  const closeMega = () => {
    closeTimer.current = setTimeout(() => {
      setMegaOpen(false);
      setMegaHovered(null);
    }, 150);
  };

  const { icon: MsgIcon, text: msgText } = ANNOUNCEMENT_MESSAGES[msgIdx];
  const selectedLabel =
    !activeCategory || activeCategory === 'Tous' ? 'Toutes les catégories' : activeCategory;

  const megaProducts = megaHovered
    ? products.filter((p) => p.category === megaHovered && p.status !== 'inactive').slice(0, 8)
    : [];

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-sm border-b border-border'
            : 'bg-background'
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-primary text-primary-foreground text-[11px] font-medium py-1.5 px-4 text-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={msgIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center gap-1.5"
            >
              <MsgIcon className="w-3 h-3 shrink-0" />
              {msgText}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Main nav row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">

            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 sm:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu catégories"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <BrandLogo size="sm" />
            </a>

            {/* Search bar — desktop */}
            <div className="flex-1 max-w-lg hidden sm:flex items-stretch rounded-lg overflow-visible border border-border bg-secondary h-9">
              {/* Category dropdown trigger */}
              <div ref={catDropdownRef} className="relative shrink-0">
                <button
                  onClick={() => setCatDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 h-full text-sm font-medium text-foreground border-r border-border whitespace-nowrap hover:bg-muted/60 transition-colors rounded-l-lg"
                >
                  <span className="max-w-[120px] truncate text-xs">{selectedLabel}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-muted-foreground transition-transform duration-150 ${
                      catDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {catDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-[calc(100%+4px)] left-0 bg-background border border-border rounded-xl shadow-lg z-[60] min-w-[200px] py-1 overflow-hidden"
                    >
                      <button
                        onClick={() => { onCategorySelect?.('Tous'); setCatDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          activeCategory === 'Tous' || !activeCategory
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-foreground hover:bg-secondary'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4 shrink-0" />
                        Toutes les catégories
                      </button>
                      {categories.length > 0 && <div className="border-t border-border my-1" />}
                      {categories.map(({ name, icon }) => {
                        const Icon = icon ? ICON_COMPONENTS[icon] : null;
                        const isActive = activeCategory === name;
                        return (
                          <button
                            key={name}
                            onClick={() => { onCategorySelect?.(name); setCatDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'text-primary font-medium bg-primary/5'
                                : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            {Icon && <Icon className="w-4 h-4 shrink-0 text-primary/70" />}
                            {!Icon && <Package className="w-4 h-4 shrink-0 text-muted-foreground" />}
                            {name}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={desktopSearchRef}
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  className="pl-9 pr-8 h-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-lg text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                {searchFocused && (
                  <SearchSuggestions
                    query={searchQuery}
                    products={products}
                    onCategorySelect={(category) => {
                      onCategorySelect?.(category);
                      onSearchChange('');
                    }}
                    onSelect={() => setSearchFocused(false)}
                  />
                )}
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="w-9 h-9" onClick={toggleTheme} aria-label="Changer le thème">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button variant="ghost" size="icon" className="relative w-9 h-9" onClick={onWishlistOpen} aria-label="Mes favoris">
                <Heart className={`w-4 h-4 transition-colors ${totalWishlist > 0 ? 'text-red-500' : ''}`} />
                {totalWishlist > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalWishlist}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" className="relative w-9 h-9" onClick={onCartOpen}>
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden pb-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={mobileSearchRef}
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                className="pl-9 pr-8 h-8 bg-secondary border-0 text-sm"
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              {searchFocused && (
                <SearchSuggestions
                  query={searchQuery}
                  products={products}
                  onCategorySelect={(category) => {
                    onCategorySelect?.(category);
                    onSearchChange('');
                  }}
                  onSelect={() => setSearchFocused(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Category nav bar + mega menu (desktop only) ── */}
        <div
          ref={megaAreaRef}
          className="hidden sm:block border-t border-border bg-background relative"
          onMouseLeave={closeMega}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-stretch h-10">

              {/* "Toutes les catégories" trigger */}
              <div
                className="relative shrink-0"
                onMouseEnter={() => {
                  openMega();
                  setMegaHovered((prev) => prev || (categories[0]?.name ?? null));
                }}
              >
                <button
                  onClick={() => { onCategorySelect?.('Tous'); setMegaOpen(false); }}
                  className={`flex items-center gap-2 px-4 h-full text-sm font-semibold transition-colors ${
                    megaOpen ? 'bg-primary/90' : 'bg-primary'
                  } text-primary-foreground`}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Toutes les catégories</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px bg-border" />

              {/* Individual category tabs */}
              {categories.map(({ name, icon }) => {
                const Icon = icon ? ICON_COMPONENTS[icon] : null;
                const isActive = activeCategory === name;
                const isHighlighted = megaOpen && megaHovered === name;
                return (
                  <button
                    key={name}
                    onClick={() => { onCategorySelect?.(name); setMegaOpen(false); setMegaHovered(null); }}
                    onMouseEnter={() => { openMega(); setMegaHovered(name); }}
                    className={`flex items-center gap-1.5 px-3 lg:px-4 h-full text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                      isHighlighted
                        ? 'text-primary border-primary bg-primary/5'
                        : isActive
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mega menu panel */}
          <AnimatePresence>
            {megaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                onMouseEnter={openMega}
                className="absolute top-full left-0 right-0 bg-background border-b border-x border-border shadow-2xl z-[60] overflow-hidden"
              >
                <div className="max-w-7xl mx-auto flex" style={{ minHeight: 280 }}>

                  {/* Left column — category list */}
                  <div className="w-56 shrink-0 border-r border-border py-2 overflow-y-auto">
                    {categories.map(({ name, icon }) => {
                      const Icon = icon ? ICON_COMPONENTS[icon] : null;
                      const isHov = megaHovered === name;
                      return (
                        <button
                          key={name}
                          onMouseEnter={() => setMegaHovered(name)}
                          onClick={() => { onCategorySelect?.(name); setMegaOpen(false); setMegaHovered(null); }}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                            isHov
                              ? 'bg-primary/8 text-primary font-medium border-l-[3px] border-primary'
                              : 'text-foreground hover:bg-secondary border-l-[3px] border-transparent'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            {Icon
                              ? <Icon className={`w-4 h-4 shrink-0 ${isHov ? 'text-primary' : 'text-muted-foreground'}`} />
                              : <Package className="w-4 h-4 shrink-0 text-muted-foreground" />
                            }
                            {name}
                          </span>
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-opacity ${isHov ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Right panel — products of hovered category */}
                  <div className="flex-1 p-5">
                    <AnimatePresence mode="wait">
                      {megaHovered && (
                        <motion.div
                          key={megaHovered}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            {(() => {
                              const cat = categories.find((c) => c.name === megaHovered);
                              const Icon = cat?.icon ? ICON_COMPONENTS[cat.icon] : null;
                              return Icon ? <Icon className="w-4 h-4 text-primary" /> : null;
                            })()}
                            {megaHovered}
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              {megaProducts.length} produit{megaProducts.length !== 1 ? 's' : ''}
                            </span>
                          </h3>

                          {megaProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {megaProducts.map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => { onCategorySelect?.(megaHovered); setMegaOpen(false); }}
                                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-secondary transition-all text-left group"
                                >
                                  {product.image_url ? (
                                    <img
                                      src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'fill' })}
                                      alt={product.name}
                                      className="w-12 h-12 rounded-lg object-cover shrink-0 bg-white"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                      <Package className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate leading-snug group-hover:text-primary transition-colors">
                                      {product.name}
                                    </p>
                                    <p className="text-xs text-primary font-semibold mt-0.5">
                                      {product.price?.toLocaleString('fr-MA')} MAD
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                              <Package className="w-8 h-8 opacity-30" />
                              <p className="text-sm">Aucun produit dans cette catégorie</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.header>

      {/* Mobile category drawer */}
      {createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] bg-black/40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                className="fixed top-0 left-0 bottom-0 z-[201] w-72 bg-background shadow-xl flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Catégories</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  <button
                    onClick={() => { onCategorySelect?.('Tous'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px] ${
                      activeCategory === 'Tous' || !activeCategory
                        ? 'border-primary text-primary font-medium bg-primary/5'
                        : 'border-transparent text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LayoutGrid className={`w-4 h-4 shrink-0 ${activeCategory === 'Tous' || !activeCategory ? 'text-primary' : 'text-muted-foreground'}`} />
                    Tous les produits
                    <span className="ml-auto text-xs text-muted-foreground font-normal">{products.length}</span>
                  </button>

                  <div className="border-t border-border my-1 mx-4" />

                  {categories.map(({ name, icon }) => {
                    const Icon = icon ? ICON_COMPONENTS[icon] : null;
                    const isActive = activeCategory === name;
                    const count = products.filter((p) => p.category === name).length;
                    return (
                      <button
                        key={name}
                        onClick={() => { onCategorySelect?.(name); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-[3px] ${
                          isActive
                            ? 'border-primary text-primary font-medium bg-primary/5'
                            : 'border-transparent text-foreground hover:bg-secondary'
                        }`}
                      >
                        {Icon
                          ? <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          : <Package className="w-4 h-4 shrink-0 text-muted-foreground" />
                        }
                        {name}
                        {count > 0 && (
                          <span className={`ml-auto text-xs font-normal ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
