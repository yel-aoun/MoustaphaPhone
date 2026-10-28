import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/lib/cartStore';
import { useSeo } from '@/lib/seo';
import { trackEvent } from '@/lib/storeEvents';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/lib/products';
import { storeBrand } from '@/lib/brand';
import StoreLayout, { useStoreProducts } from '@/components/store/StoreLayout';
import ProductGrid from '@/components/store/ProductGrid';

const SORT_OPTIONS = [
  { value: 'default', label: 'Recommandés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
];

function FilterPanel({ categories, counts, total, activeCategory, onCategory, saleOnly, setSaleOnly, inStockOnly, setInStockOnly, minPrice, setMinPrice, maxPrice, setMaxPrice }) {
  const priceInput = 'h-10 w-full min-w-0 rounded-xl bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
  const toggle = (active) => `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-muted'}`;

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Catégories</p>
        <ul className="space-y-0.5">
          {[{ name: 'Tous', count: total }, ...categories.map((c) => ({ name: c.name, count: counts[c.name] || 0 }))].map(({ name, count }) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => onCategory(name)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                  activeCategory === name ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {name === 'Tous' ? 'Tous les produits' : name}
                <span className="text-xs text-muted-foreground">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Disponibilité</p>
        <button type="button" onClick={() => setSaleOnly((v) => !v)} className={toggle(saleOnly)} aria-pressed={saleOnly}>
          En promotion {saleOnly && <X className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => setInStockOnly((v) => !v)} className={toggle(inStockOnly)} aria-pressed={inStockOnly}>
          En stock uniquement {inStockOnly && <X className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Prix (MAD)</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={priceInput} />
          <span className="text-muted-foreground">–</span>
          <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={priceInput} />
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { activeProducts, isLoading, isError, error } = useStoreProducts();
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'default');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('max') || '');
  const [saleOnly, setSaleOnly] = useState(() => searchParams.get('sale') === '1');
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get('stock') === '1');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = useMemo(() => {
    if (!categorySlug) return 'Tous';
    return categories.find((category) => slugify(category.name) === categorySlug)?.name || 'Tous';
  }, [categories, categorySlug]);

  // Header search navigates here with ?q=, so follow external changes to it
  const urlQuery = searchParams.get('q') || '';
  useEffect(() => { setSearchQuery(urlQuery); }, [urlQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery);
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    if (saleOnly) params.set('sale', '1');
    if (inStockOnly) params.set('stock', '1');
    setSearchParams(params, { replace: true });
  }, [inStockOnly, maxPrice, minPrice, saleOnly, searchQuery, setSearchParams, sortBy]);

  useSeo({
    title: activeCategory === 'Tous' ? 'Boutique' : activeCategory,
    description: storeBrand.description,
    url: window.location.href,
  });

  const productCounts = useMemo(() => {
    const counts = {};
    for (const p of activeProducts) if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [activeProducts]);

  const sorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = activeProducts.filter((p) => {
      const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
      const matchesSearch = !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchesMin = minPrice === '' || p.price >= Number(minPrice);
      const matchesMax = maxPrice === '' || p.price <= Number(maxPrice);
      const matchesSale = !saleOnly || (p.original_price && p.original_price > p.price);
      const matchesStock = !inStockOnly || p.status === 'active' || !p.status;
      return matchesCategory && matchesSearch && matchesMin && matchesMax && matchesSale && matchesStock;
    });
    const sortFn = (a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      return 0;
    };
    // Available products first, out-of-stock last
    const available = filtered.filter((p) => p.status !== 'out_of_stock').sort(sortFn);
    const oos = filtered.filter((p) => p.status === 'out_of_stock').sort(sortFn);
    return [...available, ...oos];
  }, [activeCategory, activeProducts, inStockOnly, maxPrice, minPrice, saleOnly, searchQuery, sortBy]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      trackEvent(sorted.length > 0 ? 'search' : 'empty_search', {
        search_query: query,
        metadata: { result_count: sorted.length, category: activeCategory },
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [activeCategory, searchQuery, sorted.length]);

  const goToCategory = (name) => {
    const search = searchParams.toString();
    navigate(`${name === 'Tous' ? '/boutique' : `/category/${slugify(name)}`}${search ? `?${search}` : ''}`);
    setFiltersOpen(false);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSortBy('default');
    setMinPrice('');
    setMaxPrice('');
    setSaleOnly(false);
    setInStockOnly(false);
    navigate('/boutique');
  };

  const chips = [
    searchQuery.trim() && { label: `« ${searchQuery.trim()} »`, clear: () => setSearchQuery('') },
    saleOnly && { label: 'En promotion', clear: () => setSaleOnly(false) },
    inStockOnly && { label: 'En stock', clear: () => setInStockOnly(false) },
    (minPrice || maxPrice) && { label: `${minPrice || 0} – ${maxPrice || '∞'} MAD`, clear: () => { setMinPrice(''); setMaxPrice(''); } },
  ].filter(Boolean);

  const filterProps = {
    categories, counts: productCounts, total: activeProducts.length, activeCategory, onCategory: goToCategory,
    saleOnly, setSaleOnly, inStockOnly, setInStockOnly, minPrice, setMinPrice, maxPrice, setMaxPrice,
  };
  const filterCount = chips.length - (searchQuery.trim() ? 1 : 0);

  return (
    <StoreLayout>
      <div className="container-store pb-16 pt-8 sm:pt-12">
        <nav className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Accueil</Link>
          <span className="mx-1.5">/</span>
          {activeCategory === 'Tous' ? <span className="text-foreground">Boutique</span> : (
            <>
              <Link to="/boutique" className="hover:text-foreground">Boutique</Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">{activeCategory}</span>
            </>
          )}
        </nav>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {activeCategory === 'Tous' ? 'Boutique' : activeCategory}
        </h1>

        {/* Mobile category chips */}
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {['Tous', ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => goToCategory(name)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === name ? 'bg-foreground text-background' : 'bg-secondary text-foreground'
              }`}
            >
              {name === 'Tous' ? 'Tout' : name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans la boutique"
                  className="h-11 w-full rounded-full bg-secondary pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-label="Effacer la recherche">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtres{filterCount > 0 ? ` (${filterCount})` : ''}
                </button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 flex-1 rounded-full border-border px-4 text-sm sm:w-[180px] sm:flex-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {sorted.length} produit{sorted.length !== 1 ? 's' : ''}
              </span>
              {chips.map(({ label, clear }) => (
                <button
                  key={label}
                  type="button"
                  onClick={clear}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {(chips.length > 0 || activeCategory !== 'Tous') && (
                <button type="button" onClick={handleReset} className="text-xs font-medium text-primary hover:underline">
                  Tout effacer
                </button>
              )}
            </div>

            <ProductGrid
              products={sorted}
              onAddToCart={addToCart}
              isLoading={isLoading}
              onReset={handleReset}
              suggestedCategories={categories}
            />
            {isError && (
              <div className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Impossible de charger le catalogue : {error?.message || 'erreur API'}.
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl p-0 lg:hidden">
          <SheetHeader className="px-5 pb-2 pt-5 text-left">
            <SheetTitle className="text-lg font-semibold">Filtres</SheetTitle>
            <SheetDescription className="sr-only">Catégorie, disponibilité et prix.</SheetDescription>
          </SheetHeader>
          <div className="px-5 py-4">
            <FilterPanel {...filterProps} />
          </div>
          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-border bg-background px-5 py-4">
            <button type="button" onClick={handleReset} className="h-12 rounded-full border border-border text-sm font-medium">
              Réinitialiser
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="h-12 rounded-full bg-foreground text-sm font-medium text-background">
              Voir {sorted.length} produit{sorted.length !== 1 ? 's' : ''}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </StoreLayout>
  );
}
