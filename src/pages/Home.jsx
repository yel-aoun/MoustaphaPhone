import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/lib/cartStore';
import { useWishlist } from '@/lib/wishlistStore';
import { BadgePercent, ChevronUp, PackageCheck, RotateCcw, ShieldCheck, ShoppingCart, SlidersHorizontal, Truck, X } from 'lucide-react';
import { useHeroConfig } from '@/lib/heroStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSeo } from '@/lib/seo';
import { trackEvent } from '@/lib/analytics';
import { useCategories } from '@/hooks/useCategories';
import { formatMoney, slugify } from '@/lib/products';
import { storeBrand } from '@/lib/brand';
import Header from '@/components/store/Header';
import HeroSlider from '@/components/store/HeroSlider';
import TrustBadges from '@/components/store/TrustBadges';
import CategoryBar from '@/components/store/CategoryBar';
import ProductGrid from '@/components/store/ProductGrid';
import ProductModal from '@/components/store/ProductModal';
import CartSidebar from '@/components/store/CartSidebar';
import WishlistSidebar from '@/components/store/WishlistSidebar';
import WhatsAppFloat from '@/components/store/WhatsAppFloat';
import FeaturedSection from '@/components/store/FeaturedSection';
import ComparePanel from '@/components/store/ComparePanel';
import RecentlyViewedSection from '@/components/store/RecentlyViewedSection';
import MobileBottomNav from '@/components/store/MobileBottomNav';
import Footer from '@/components/store/Footer';

const SORT_OPTIONS = [
  { value: 'default', label: 'Par défaut' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'Tous');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'default');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('max') || '');
  const [saleOnly, setSaleOnly] = useState(() => searchParams.get('sale') === '1');
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get('stock') === '1');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { config: heroConfig } = useHeroConfig();
  const { data: categories = [] } = useCategories();

  const { cart, addToCart, removeFromCart, updateQuantity, updateVariant, clearCart, totalItems, totalPrice } = useCart();
  const { wishlist, removeFromWishlist, totalWishlist } = useWishlist();

  useSeo({
    title: `${storeBrand.name} - ${storeBrand.tagline}`,
    description: storeBrand.description,
    url: `${window.location.origin}/`,
  });

  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Measure the actual header height so main content doesn't sit under it
  useEffect(() => {
    const update = () => {
      const header = document.querySelector('header');
      if (header) {
        const h = Math.ceil(header.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--header-h', `${h}px`);
      }
    };
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
    };
  }, []);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status !== 'inactive'),
    [products]
  );

  const categoryFromSlug = useMemo(() => {
    if (!categorySlug) return null;
    return categories.find((category) => slugify(category.name) === categorySlug)?.name || null;
  }, [categories, categorySlug]);

  useEffect(() => {
    if (!categorySlug || !categoryFromSlug || activeCategory === categoryFromSlug) return;
    setActiveCategory(categoryFromSlug);
    setSearchQuery('');
  }, [activeCategory, categoryFromSlug, categorySlug]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (activeCategory !== 'Tous' && (!categorySlug || activeCategory !== categoryFromSlug)) {
      params.set('category', activeCategory);
    }
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (saleOnly) params.set('sale', '1');
    if (inStockOnly) params.set('stock', '1');
    setSearchParams(params, { replace: true });
  }, [activeCategory, categoryFromSlug, categorySlug, inStockOnly, maxPrice, minPrice, saleOnly, searchQuery, setSearchParams, sortBy]);

  // Curated sections
  const onSale = activeProducts.filter(
    (p) => p.original_price && p.original_price > p.price && p.status === 'active'
  );
  const newest = activeProducts.filter((p) => p.status === 'active').slice(0, 8);

  // Hero: prioritize on-sale, then newest, then rest — deduplicated
  const heroProducts = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const p of [...onSale, ...newest, ...activeProducts]) {
      if (!seen.has(p.id) && result.length < 5) {
        seen.add(p.id);
        result.push(p);
      }
    }
    return result;
  }, [onSale, newest, activeProducts]);

  // Product counts per category (for category bar badges)
  const productCounts = useMemo(() => {
    const counts = {};
    for (const p of activeProducts) {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [activeProducts]);

  const categoryProducts = useMemo(() => {
    return activeCategory === 'Tous'
      ? activeProducts
      : activeProducts.filter((product) => product.category === activeCategory);
  }, [activeCategory, activeProducts]);

  const categoryStats = useMemo(() => {
    const promoCount = categoryProducts.filter(
      (product) => product.original_price && product.original_price > product.price
    ).length;
    const inStockCount = categoryProducts.filter((product) => product.status !== 'out_of_stock').length;
    const bestPrice = categoryProducts.reduce(
      (min, product) => Math.min(min, Number(product.price || 0)),
      Infinity
    );

    return {
      promoCount,
      inStockCount,
      bestPrice: Number.isFinite(bestPrice) ? bestPrice : 0,
    };
  }, [categoryProducts]);

  // Filter
  const filtered = activeProducts.filter((p) => {
    const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMin = minPrice === '' || p.price >= Number(minPrice);
    const matchesMax = maxPrice === '' || p.price <= Number(maxPrice);
    const matchesSale = !saleOnly || (p.original_price && p.original_price > p.price);
    const matchesStock = !inStockOnly || p.status === 'active' || !p.status;
    return matchesCategory && matchesSearch && matchesMin && matchesMax && matchesSale && matchesStock;
  });

  // Sort: available first, out-of-stock last — then apply sort within each group
  const sorted = useMemo(() => {
    const sortFn = (a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      return 0;
    };
    const available = filtered.filter((p) => p.status !== 'out_of_stock').sort(sortFn);
    const oos = filtered.filter((p) => p.status === 'out_of_stock').sort(sortFn);
    return [...available, ...oos];
  }, [filtered, sortBy]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return undefined;

    const timer = window.setTimeout(() => {
      trackEvent(sorted.length > 0 ? 'search' : 'empty_search', {
        search_query: query,
        metadata: {
          result_count: sorted.length,
          category: activeCategory,
        },
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [activeCategory, searchQuery, sorted.length]);

  const scrollToCatalogue = () =>
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    if (cat === 'Tous') navigate('/');
    else navigate(`/category/${slugify(cat)}`);
    scrollToCatalogue();
  };

  const handleReset = () => {
    setActiveCategory('Tous');
    setSearchQuery('');
    setSortBy('default');
    setMinPrice('');
    setMaxPrice('');
    setSaleOnly(false);
    setInStockOnly(false);
    navigate('/');
  };

  const hasActiveFilters =
    minPrice !== '' ||
    maxPrice !== '' ||
    saleOnly ||
    inStockOnly ||
    searchQuery.trim() !== '' ||
    sortBy !== 'default' ||
    activeCategory !== 'Tous';

  const activeFilterCount = [
    activeCategory !== 'Tous',
    searchQuery.trim() !== '',
    saleOnly,
    inStockOnly,
    minPrice !== '' || maxPrice !== '',
    sortBy !== 'default',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Header
        totalItems={totalItems}
        onCartOpen={() => setCartOpen(true)}
        totalWishlist={totalWishlist}
        onWishlistOpen={() => setWishlistOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategorySelect={handleCategorySelect}
        products={activeProducts}
      />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="h-[88vh] overflow-y-auto p-0 sm:hidden">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filtres
            </SheetTitle>
            <SheetDescription className="sr-only">
              Ajuster la catégorie, le prix, la disponibilité et le tri du catalogue.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 py-5">
            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Catégorie</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('Tous')}
                  className={`h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    activeCategory === 'Tous'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-foreground'
                  }`}
                >
                  Tous ({activeProducts.length})
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => handleCategorySelect(category.name)}
                    className={`h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      activeCategory === category.name
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary text-foreground'
                    }`}
                  >
                    <span className="block truncate">
                      {category.name} ({productCounts[category.name] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Disponibilité</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleOnly((value) => !value)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    saleOnly
                      ? 'border-orange-500/30 bg-orange-500/10 text-orange-500'
                      : 'border-border bg-secondary text-foreground'
                  }`}
                >
                  <BadgePercent className="h-4 w-4" />
                  Promos
                </button>
                <button
                  type="button"
                  onClick={() => setInStockOnly((value) => !value)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    inStockOnly
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-border bg-secondary text-foreground'
                  }`}
                >
                  <PackageCheck className="h-4 w-4" />
                  En stock
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Prix</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tri</p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full border-border bg-secondary text-sm focus:ring-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </div>

          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-border bg-background px-4 py-4">
            <button
              type="button"
              onClick={handleReset}
              className="h-11 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-muted-foreground"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Voir {sorted.length} produit{sorted.length !== 1 ? 's' : ''}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-16"
        style={{ paddingTop: 'calc(var(--header-h, 160px) + 16px)' }}
      >
        {!searchQuery && (
          <>
            <HeroSlider products={heroProducts} heroConfig={heroConfig} onQuickView={setSelectedProduct} />

            {onSale.length > 0 && (
              <FeaturedSection
                title="Offres du moment"
                subtitle="Prix réduits — durée limitée"
                products={onSale}
                onAddToCart={addToCart}
                onQuickView={setSelectedProduct}
                onViewAll={() => { setSaleOnly(true); scrollToCatalogue(); }}
              />
            )}

            {newest.length > 0 && (
              <FeaturedSection
                title="Nouveautés"
                subtitle="Les derniers arrivages"
                products={newest}
                onAddToCart={addToCart}
                onQuickView={setSelectedProduct}
                onViewAll={() => { setSortBy('newest'); scrollToCatalogue(); }}
              />
            )}
          </>
        )}

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 border-y border-border bg-secondary/30 px-1 py-3 sm:rounded-lg sm:border sm:px-4">
            <Truck className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Livraison 24-72h</p>
              <p className="text-xs text-muted-foreground">Partout au Maroc selon la ville</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-y border-border bg-secondary/30 px-1 py-3 sm:rounded-lg sm:border sm:px-4">
            <PackageCheck className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Stock clair</p>
              <p className="text-xs text-muted-foreground">Disponibilité affichée sur chaque produit</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-y border-border bg-secondary/30 px-1 py-3 sm:rounded-lg sm:border sm:px-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Paiement à la livraison</p>
              <p className="text-xs text-muted-foreground">Confirmation rapide par WhatsApp</p>
            </div>
          </div>
        </section>

        {activeCategory !== 'Tous' && (
          <section className="mb-6 overflow-hidden border-y border-border bg-secondary/25 px-4 py-5 sm:rounded-lg sm:border sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Catégorie</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-normal text-foreground sm:text-3xl">
                  {activeCategory}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {categoryProducts.length} produit{categoryProducts.length !== 1 ? 's' : ''}, livraison rapide et paiement à la réception.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="font-mono text-lg font-extrabold text-foreground">{categoryStats.inStockCount}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">En stock</p>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="font-mono text-lg font-extrabold text-foreground">{categoryStats.promoCount}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">Promos</p>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="font-mono text-sm font-extrabold text-foreground sm:text-base">
                    {categoryStats.bestPrice ? formatMoney(categoryStats.bestPrice) : '-'}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground">Dès</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div id="catalogue" className="scroll-mt-[calc(var(--header-h,160px)+18px)]">
          <div className="mb-4 rounded-lg border border-border bg-background p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-xl font-extrabold tracking-normal text-foreground">Catalogue</h2>
                  <span className="text-sm font-medium text-muted-foreground">
                    {sorted.length} produit{sorted.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeCategory === 'Tous' ? 'Tous les produits disponibles' : activeCategory}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSaleOnly((v) => !v)}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    saleOnly
                      ? 'border-orange-500/30 bg-orange-500/10 text-orange-500'
                      : 'border-border bg-secondary text-foreground hover:border-orange-500/30 hover:text-orange-500'
                  }`}
                  aria-pressed={saleOnly}
                >
                  <BadgePercent className="h-4 w-4" />
                  Promos
                </button>

                <button
                  type="button"
                  onClick={() => setInStockOnly((v) => !v)}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    inStockOnly
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : 'border-border bg-secondary text-foreground hover:border-emerald-500/30 hover:text-emerald-600'
                  }`}
                  aria-pressed={inStockOnly}
                >
                  <PackageCheck className="h-4 w-4" />
                  En stock
                </button>

                {/* Price range filter */}
                <div className="col-span-2 flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2 sm:col-span-1">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">Prix</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-7 w-full min-w-0 rounded-md bg-background px-2 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30 sm:w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-7 w-full min-w-0 rounded-md bg-background px-2 text-sm text-foreground outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30 sm:w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">MAD</span>
                </div>

                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-full border-border bg-secondary text-sm focus:ring-primary/30 sm:w-[156px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Effacer
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {activeCategory !== 'Tous' && (
                <button
                  onClick={() => handleCategorySelect('Tous')}
                  className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {activeCategory}
                  <X className="w-3 h-3" />
                </button>
              )}
              {saleOnly && (
                <button
                  onClick={() => setSaleOnly(false)}
                  className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-1 rounded-full font-medium hover:bg-orange-500/20 transition-colors"
                >
                  Promotions
                  <X className="w-3 h-3" />
                </button>
              )}
              {inStockOnly && (
                <button
                  onClick={() => setInStockOnly(false)}
                  className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  En stock
                  <X className="w-3 h-3" />
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Recherche : {searchQuery}
                  <X className="w-3 h-3" />
                </button>
              )}
              {(minPrice || maxPrice) && (
                <button
                  onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
                >
                  Prix : {minPrice || '0'} – {maxPrice || '∞'} MAD
                  <X className="w-3 h-3" />
                </button>
              )}
              {sortBy !== 'default' && (
                <button
                  onClick={() => setSortBy('default')}
                  className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}

          <div className="mb-6 hidden sm:block">
            <CategoryBar
              active={activeCategory}
              onSelect={handleCategorySelect}
              productCounts={productCounts}
            />
          </div>

          <ProductGrid
            products={sorted}
            onAddToCart={addToCart}
            onQuickView={setSelectedProduct}
            isLoading={isLoading}
            onReset={handleReset}
            suggestedCategories={categories}
            onCategorySelect={(category) => {
              handleCategorySelect(category);
              setSearchQuery('');
            }}
            popularProducts={newest}
          />
          {isError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Impossible de charger le catalogue: {error?.message || 'erreur API'}. Vérifiez `/api/health` sur Vercel.
            </div>
          )}
        </div>

        <RecentlyViewedSection
          products={activeProducts}
          onAddToCart={addToCart}
          onQuickView={setSelectedProduct}
        />
      </main>

      <TrustBadges />
      <Footer onCategorySelect={handleCategorySelect} />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      <WishlistSidebar
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={removeFromWishlist}
        onAddToCart={addToCart}
      />

      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totalPrice={totalPrice}
        products={activeProducts}
        onUpdateQuantity={updateQuantity}
        onUpdateVariant={updateVariant}
        onRemove={removeFromCart}
        onClear={clearCart}
      />

      <WhatsAppFloat cart={cart} totalPrice={totalPrice} />
      <ComparePanel products={activeProducts} />
      <MobileBottomNav
        totalItems={totalItems}
        totalWishlist={totalWishlist}
        onCartOpen={() => setCartOpen(true)}
        onWishlistOpen={() => setWishlistOpen(true)}
        onCategoriesOpen={() => setFiltersOpen(true)}
      />

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            type="button"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed inset-x-0 bottom-16 z-40 flex min-h-16 items-center justify-between gap-3 border-t border-border bg-background/96 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden"
          >
            <span className="flex items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">
                  Panier · {totalItems} article{totalItems > 1 ? 's' : ''}
                </span>
                <span className="block font-mono text-sm font-extrabold text-primary">{formatMoney(totalPrice)}</span>
              </span>
            </span>
            <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              Voir
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-52 right-6 z-40 w-11 h-11 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors sm:bottom-24"
            aria-label="Retour en haut"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
