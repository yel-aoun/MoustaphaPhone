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
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Announcement ticker */}
        <div className="overflow-hidden bg-foreground text-background">
          <div className="flex w-max animate-marquee py-1.5 hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map(({ icon: Icon, text }, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className="flex items-center gap-2 px-6 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em]"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-neon" />
                    {text}
                    <span className="ml-6 h-1 w-1 rounded-full bg-background/30" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Floating capsule */}
        <div className="px-2.5 pt-2 sm:px-4 sm:pt-3">
          <div
            className={`glass relative mx-auto max-w-7xl rounded-[22px] transition-shadow duration-300 ${
              scrolled ? 'shadow-[0_18px_50px_-20px_rgba(10,10,30,0.35)]' : ''
            }`}
          >
            <div className="px-2.5 sm:px-5">
              <div className="flex h-14 items-center justify-between gap-1.5 sm:h-16 sm:gap-3">

                {/* Hamburger — mobile only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full sm:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Menu catégories"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Logo */}
                <a href="/" className="flex min-w-0 items-center gap-2">
                  <BrandLogo size="sm" />
                </a>

                {/* Search bar — desktop */}
                <div className="hidden h-10 max-w-xl flex-1 items-stretch overflow-visible rounded-full border border-foreground/[0.06] bg-secondary/70 transition-colors focus-within:border-primary/40 focus-within:bg-background sm:flex">
                  {/* Category dropdown trigger */}
                  <div ref={catDropdownRef} className="relative shrink-0">
                    <button
                      onClick={() => setCatDropdownOpen((v) => !v)}
                      className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-l-full border-r border-foreground/[0.06] pl-4 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
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
                          className="absolute left-0 top-[calc(100%+8px)] z-[60] min-w-[220px] overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl"
                        >
                          <button
                            onClick={() => { onCategorySelect?.('Tous'); setCatDropdownOpen(false); }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                              activeCategory === 'Tous' || !activeCategory
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            <LayoutGrid className="w-4 h-4 shrink-0" />
                            Toutes les catégories
                          </button>
                          {categories.length > 0 && <div className="mx-2 my-1 border-t border-border" />}
                          {categories.map(({ name, icon }) => {
                            const Icon = icon ? ICON_COMPONENTS[icon] : null;
                            const isActive = activeCategory === name;
                            return (
                              <button
                                key={name}
                                onClick={() => { onCategorySelect?.(name); setCatDropdownOpen(false); }}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                  isActive
                                    ? 'bg-primary/10 font-medium text-primary'
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
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      ref={desktopSearchRef}
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                      className="h-full rounded-r-full border-0 bg-transparent pl-9 pr-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
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
                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleTheme} aria-label="Changer le thème">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>

                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" onClick={onWishlistOpen} aria-label="Mes favoris">
                    <Heart className={`w-4 h-4 transition-colors ${totalWishlist > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    {totalWishlist > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {totalWishlist}
                      </span>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={onCartOpen}
                    aria-label="Panier"
                    className="relative flex h-9 items-center gap-1.5 rounded-full bg-foreground px-2.5 text-background transition-transform hover:scale-[1.03] active:scale-95 sm:px-3.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden text-xs font-semibold sm:inline">Panier</span>
                    {totalItems > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1 font-mono text-[10px] font-bold text-neon-foreground">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile search */}
              <div className="sm:hidden pb-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    ref={mobileSearchRef}
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                    className="h-9 rounded-full border-0 bg-secondary/80 pl-9 pr-9 text-sm"
                  />
                  {searchQuery && (
                    <button onClick={() => onSearchChange('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
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

            {/* ── Category nav row + mega menu (desktop only) ── */}
            <div
              ref={megaAreaRef}
              className="hidden border-t border-foreground/[0.06] sm:block"
              onMouseLeave={closeMega}
            >
              <div className="no-scrollbar flex h-11 items-center gap-1 overflow-x-auto px-3 sm:px-4">

                {/* "Toutes les catégories" trigger */}
                <div
                  className="shrink-0"
                  onMouseEnter={() => {
                    openMega();
                    setMegaHovered((prev) => prev || (categories[0]?.name ?? null));
                  }}
                >
                  <button
                    onClick={() => { onCategorySelect?.('Tous'); setMegaOpen(false); }}
                    className={`flex h-8 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                      megaOpen ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">Toutes les catégories</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                <div className="mx-1 h-4 w-px shrink-0 bg-border" />

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
                      className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors ${
                        isHighlighted || isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground'
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                      <span>{name}</span>
                    </button>
                  );
                })}
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
                    className="absolute left-0 right-0 top-full z-[60] pt-2"
                  >
                    <div className="flex overflow-hidden rounded-[22px] border border-border bg-popover shadow-2xl" style={{ minHeight: 280 }}>

                      {/* Left column — category list */}
                      <div className="w-60 shrink-0 overflow-y-auto border-r border-border p-2">
                        {categories.map(({ name, icon }) => {
                          const Icon = icon ? ICON_COMPONENTS[icon] : null;
                          const isHov = megaHovered === name;
                          return (
                            <button
                              key={name}
                              onMouseEnter={() => setMegaHovered(name)}
                              onClick={() => { onCategorySelect?.(name); setMegaOpen(false); setMegaHovered(null); }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                isHov
                                  ? 'bg-primary/10 font-medium text-primary'
                                  : 'text-foreground hover:bg-secondary'
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
                              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                                {(() => {
                                  const cat = categories.find((c) => c.name === megaHovered);
                                  const Icon = cat?.icon ? ICON_COMPONENTS[cat.icon] : null;
                                  return Icon ? <Icon className="w-4 h-4 text-primary" /> : null;
                                })()}
                                {megaHovered}
                                <span className="ml-1 font-mono text-[11px] font-normal text-muted-foreground">
                                  {megaProducts.length} produit{megaProducts.length !== 1 ? 's' : ''}
                                </span>
                              </h3>

                              {megaProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                  {megaProducts.map((product) => (
                                    <button
                                      key={product.id}
                                      onClick={() => { onCategorySelect?.(megaHovered); setMegaOpen(false); }}
                                      className="group flex items-center gap-3 rounded-2xl border border-transparent p-2 text-left transition-all hover:border-border hover:bg-secondary/60"
                                    >
                                      {product.image_url ? (
                                        <img
                                          src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'fill' })}
                                          alt={product.name}
                                          className="h-14 w-14 shrink-0 rounded-xl bg-white object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary">
                                          <Package className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                                          {product.name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs font-semibold text-foreground/80">
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
          </div>
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
                className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                className="fixed bottom-2 left-2 top-2 z-[201] flex w-72 flex-col overflow-hidden rounded-[22px] border border-border bg-background shadow-2xl"
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
