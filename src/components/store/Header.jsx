import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingCart, Search, X, Truck, RotateCcw, Shield, Heart,
  Sun, Moon, ChevronDown, ChevronRight, LayoutGrid, Package, Menu, Phone,
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
import { storeBrand } from '@/lib/brand';

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
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % ANNOUNCEMENT_MESSAGES.length), 4500);
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
        className={`fixed top-0 left-0 right-0 z-50 bg-background transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_6px_24px_-12px_rgba(20,20,40,0.25)]' : ''
        }`}
      >
        {/* Info bar */}
        <div className="bg-primary text-primary-foreground">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-center px-4 text-[11.5px] font-semibold sm:justify-between sm:px-6 lg:px-10">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Phone className="h-3.5 w-3.5" />
              {storeBrand.whatsappDisplay} · {storeBrand.supportHours}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={msgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-1.5"
              >
                <MsgIcon className="h-3.5 w-3.5 shrink-0" />
                {msgText}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Main row */}
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-10">
            <div className="flex h-16 items-center justify-between gap-2 sm:h-[72px] sm:gap-6">

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
              <a href="/" className="flex min-w-0 items-center gap-2">
                <BrandLogo size="sm" />
              </a>

              {/* Search bar — desktop */}
              <div className="hidden h-11 max-w-2xl flex-1 items-stretch rounded-xl border-2 border-primary bg-background sm:flex">
                {/* Category dropdown trigger */}
                <div ref={catDropdownRef} className="relative shrink-0">
                  <button
                    onClick={() => setCatDropdownOpen((v) => !v)}
                    className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-l-[10px] border-r border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="max-w-[120px] truncate text-xs">{selectedLabel}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${
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
                        className="absolute left-0 top-[calc(100%+6px)] z-[60] min-w-[220px] overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-xl"
                      >
                        <button
                          onClick={() => { onCategorySelect?.('Tous'); setCatDropdownOpen(false); }}
                          className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            activeCategory === 'Tous' || !activeCategory
                              ? 'bg-primary/5 font-semibold text-primary'
                              : 'text-foreground hover:bg-surface'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4 shrink-0" />
                          Toutes les catégories
                        </button>
                        {categories.length > 0 && <div className="my-1 border-t border-border" />}
                        {categories.map(({ name, icon }) => {
                          const Icon = icon ? ICON_COMPONENTS[icon] : null;
                          const isActive = activeCategory === name;
                          return (
                            <button
                              key={name}
                              onClick={() => { onCategorySelect?.(name); setCatDropdownOpen(false); }}
                              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? 'bg-primary/5 font-semibold text-primary'
                                  : 'text-foreground hover:bg-surface'
                              }`}
                            >
                              {Icon && <Icon className="w-4 h-4 shrink-0 text-primary" />}
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
                  <Input
                    ref={desktopSearchRef}
                    placeholder="iPhone, coque, chargeur, écouteurs..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                    className="h-full rounded-none border-0 bg-transparent pl-4 pr-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label="Effacer la recherche"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
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
                <button
                  type="button"
                  onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
                  className="m-1 flex items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline">Rechercher</span>
                </button>
              </div>

              {/* Right actions */}
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleTheme} aria-label="Changer le thème">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                <button
                  type="button"
                  onClick={onWishlistOpen}
                  aria-label="Mes favoris"
                  className="relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface sm:h-12 sm:w-14"
                >
                  <Heart className={`h-5 w-5 ${totalWishlist > 0 ? 'fill-primary text-primary' : ''}`} />
                  <span className="hidden text-[10.5px] font-semibold sm:block">Favoris</span>
                  {totalWishlist > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground sm:right-2">
                      {totalWishlist}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onCartOpen}
                  aria-label="Panier"
                  className="relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface sm:h-12 sm:w-14"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden text-[10.5px] font-semibold sm:block">Panier</span>
                  {totalItems > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-deal px-1 text-[9px] font-extrabold text-deal-foreground sm:right-2">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile search */}
            <div className="sm:hidden pb-3">
              <div className="relative flex h-10 items-stretch rounded-xl border-2 border-primary bg-background">
                <Input
                  ref={mobileSearchRef}
                  placeholder="Rechercher un téléphone, une coque..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  className="h-full flex-1 rounded-none border-0 bg-transparent pl-3 pr-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {searchQuery && (
                  <button onClick={() => onSearchChange('')} className="absolute right-12 top-1/2 -translate-y-1/2" aria-label="Effacer la recherche">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <span className="m-0.5 flex w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="h-4 w-4" />
                </span>
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
        </div>

        {/* ── Category row + mega menu (desktop only) ── */}
        <div
          ref={megaAreaRef}
          className="relative hidden border-b border-border bg-surface sm:block"
          onMouseLeave={closeMega}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="no-scrollbar flex h-11 items-stretch gap-1 overflow-x-auto">

              {/* "Tous les rayons" trigger */}
              <div
                className="flex shrink-0 items-center"
                onMouseEnter={() => {
                  openMega();
                  setMegaHovered((prev) => prev || (categories[0]?.name ?? null));
                }}
              >
                <button
                  onClick={() => { onCategorySelect?.('Tous'); setMegaOpen(false); }}
                  className="flex h-8 items-center gap-2 rounded-lg bg-foreground px-3.5 text-[13px] font-bold text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Menu className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Tous les rayons</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

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
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-[3px] px-3 text-[13px] font-semibold transition-colors ${
                      isHighlighted || isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-foreground/75 hover:text-primary'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
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
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                onMouseEnter={openMega}
                className="absolute left-0 right-0 top-full z-[60] border-b border-border bg-popover shadow-2xl"
              >
                <div className="mx-auto flex max-w-7xl" style={{ minHeight: 280 }}>

                  {/* Left column — category list */}
                  <div className="w-60 shrink-0 overflow-y-auto border-r border-border bg-surface py-2">
                    {categories.map(({ name, icon }) => {
                      const Icon = icon ? ICON_COMPONENTS[icon] : null;
                      const isHov = megaHovered === name;
                      return (
                        <button
                          key={name}
                          onMouseEnter={() => setMegaHovered(name)}
                          onClick={() => { onCategorySelect?.(name); setMegaOpen(false); setMegaHovered(null); }}
                          className={`flex w-full items-center justify-between gap-2 px-5 py-2.5 text-sm transition-colors ${
                            isHov
                              ? 'bg-background font-bold text-primary'
                              : 'text-foreground hover:bg-background'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            {Icon
                              ? <Icon className={`w-4 h-4 shrink-0 ${isHov ? 'text-primary' : 'text-muted-foreground'}`} />
                              : <Package className="w-4 h-4 shrink-0 text-muted-foreground" />
                            }
                            {name}
                          </span>
                          <ChevronRight className={`w-4 h-4 shrink-0 transition-opacity ${isHov ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Right panel — products of hovered category */}
                  <div className="flex-1 p-6">
                    <AnimatePresence mode="wait">
                      {megaHovered && (
                        <motion.div
                          key={megaHovered}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-foreground">
                              {megaHovered}
                              <span className="ml-2 text-xs font-medium text-muted-foreground">
                                {megaProducts.length} produit{megaProducts.length !== 1 ? 's' : ''}
                              </span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => { onCategorySelect?.(megaHovered); setMegaOpen(false); }}
                              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              Voir tout <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {megaProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {megaProducts.map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => { onCategorySelect?.(megaHovered); setMegaOpen(false); }}
                                  className="group flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center transition-all hover:border-primary/40 hover:shadow-soft"
                                >
                                  {product.image_url ? (
                                    <img
                                      src={cloudinaryImage(product.image_url, { width: 160, height: 160, crop: 'pad' })}
                                      alt={product.name}
                                      className="h-20 w-20 bg-white object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-surface">
                                      <Package className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary">
                                    {product.name}
                                  </p>
                                  <p className="text-sm font-extrabold text-primary">
                                    {product.price?.toLocaleString('fr-MA')} DH
                                  </p>
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
                className="fixed inset-0 z-[200] bg-black/45"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                className="fixed top-0 left-0 bottom-0 z-[201] flex w-[78vw] max-w-xs flex-col bg-background shadow-2xl"
              >
                <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm font-bold">Tous les rayons</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/15"
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
