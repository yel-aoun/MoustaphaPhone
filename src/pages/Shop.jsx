import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart } from '@/lib/cartStore';
import { useSeo } from '@/lib/seo';
import { trackEvent } from '@/lib/storeEvents';
import { useCategories } from '@/hooks/useCategories';
import { slugify } from '@/lib/products';
import { storeBrand } from '@/lib/brand';
import StoreLayout, { useStoreProducts } from '@/components/store/StoreLayout';
import ProductGrid from '@/components/store/ProductGrid';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import CountUp from '@/components/store/fx/CountUp';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';

const SORT_OPTIONS = [
  { value: 'default', label: 'Recommandés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
];

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
  const [categoryOpen, setCategoryOpen] = useState(false);

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
    setCategoryOpen(false);
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

  const pill = (active) => `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
    active ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-foreground hover:border-foreground'
  }`;
  const priceInput = 'h-10 w-full min-w-0 rounded-xl bg-secondary px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
  const ActiveIcon = categories.find((c) => c.name === activeCategory)?.icon;
  const BannerIcon = ActiveIcon ? ICON_COMPONENTS[ActiveIcon] : null;

  return (
    <StoreLayout>
      {/* Page banner */}
      <section className="relative overflow-hidden border-b border-border bg-secondary">
        <CircuitBackground className="text-foreground [mask-image:linear-gradient(90deg,transparent_35%,#000_75%)]" />
        <div className="container-store relative py-10 sm:py-14">
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
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
                {BannerIcon && (
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-primary shadow-soft sm:h-14 sm:w-14">
                    <BannerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                )}
                {saleOnly && activeCategory === 'Tous' ? 'Promotions' : activeCategory === 'Tous' ? 'Boutique' : activeCategory}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                <span className="font-semibold text-foreground"><CountUp to={sorted.length} duration={0.8} /></span> produit{sorted.length !== 1 ? 's' : ''} · livraison partout au Maroc
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-store pb-16 pt-6">
        {/* Toolbar */}
        <div className="sticky top-14 z-30 -mx-4 bg-background/85 px-4 py-3 backdrop-blur-xl sm:top-16 sm:mx-0 sm:px-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans la boutique"
                className="h-10 w-full rounded-full bg-secondary pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-label="Effacer la recherche">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-1 lg:px-0">
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className={pill(activeCategory !== 'Tous')}>
                    {activeCategory === 'Tous' ? 'Catégorie' : activeCategory}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 rounded-2xl p-1.5">
                  {[{ name: 'Tous', count: activeProducts.length }, ...categories.map((c) => ({ ...c, count: productCounts[c.name] || 0 }))].map(({ name, icon, count }) => {
                    const Icon = icon ? ICON_COMPONENTS[icon] : null;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => goToCategory(name)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
                          {Icon ? <Icon className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                        </span>
                        <span className="flex-1">{name === 'Tous' ? 'Tous les produits' : name}</span>
                        <span className="text-xs text-muted-foreground">{count}</span>
                        {activeCategory === name && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={pill(Boolean(minPrice || maxPrice))}>
                    {minPrice || maxPrice ? `${minPrice || 0} – ${maxPrice || '∞'} MAD` : 'Prix'}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 rounded-2xl p-4">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground">Prix (MAD)</p>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={priceInput} />
                    <span className="text-muted-foreground">–</span>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={priceInput} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[[0, 500], [500, 2000], [2000, 8000], [8000, '']].map(([min, max]) => (
                      <button
                        key={`${min}-${max}`}
                        type="button"
                        onClick={() => { setMinPrice(min ? String(min) : ''); setMaxPrice(max ? String(max) : ''); }}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {max ? `${min} – ${max}` : `${min}+`}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <button type="button" onClick={() => setSaleOnly((v) => !v)} className={pill(saleOnly)} aria-pressed={saleOnly}>
                <span className={`h-1.5 w-1.5 rounded-full ${saleOnly ? 'bg-background' : 'bg-deal'}`} />
                Promo
              </button>
              <button type="button" onClick={() => setInStockOnly((v) => !v)} className={pill(inStockOnly)} aria-pressed={inStockOnly}>
                En stock
              </button>

              <div className="ml-auto shrink-0">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-[170px] rounded-full border-border px-4 text-sm">
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
          </div>
        </div>

        {(chips.length > 0 || activeCategory !== 'Tous') && (
          <div className="mb-2 mt-3 flex flex-wrap items-center gap-2">
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
            <button type="button" onClick={handleReset} className="text-xs font-medium text-primary hover:underline">
              Tout effacer
            </button>
          </div>
        )}

        <div className="mt-6">
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
    </StoreLayout>
  );
}
