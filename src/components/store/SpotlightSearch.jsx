import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, CornerDownLeft, Package, PackageSearch, Percent, Search, ShoppingBag, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ICON_COMPONENTS } from '@/lib/categoryIcons';
import { cloudinaryImage } from '@/lib/images';
import { formatMoney, getProductPath, slugify } from '@/lib/products';
import { addRecentSearch, clearRecentSearches, getRecentSearches, normalizeText, productMatchesQuery } from '@/lib/search';

// Wrap the matched part of the name in a highlight, ignoring accents and case
function Highlight({ text, query }) {
  const q = normalizeText(query);
  if (!q) return text;
  const index = normalizeText(text).indexOf(q.split(/\s+/)[0]);
  if (index < 0) return text;
  const length = q.split(/\s+/)[0].length;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-primary/15 px-0.5 text-foreground">{text.slice(index, index + length)}</mark>
      {text.slice(index + length)}
    </>
  );
}

export default function SpotlightSearch({ open, onClose, products = [] }) {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    setRecent(getRecentSearches());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const clean = query.trim();

  // One flat list so arrow keys move through every visible row
  const items = useMemo(() => {
    if (clean.length < 1) {
      return [
        ...recent.map((term) => ({ type: 'recent', key: `r-${term}`, label: term, run: () => go(`/boutique?q=${encodeURIComponent(term)}`, term) })),
        { type: 'action', key: 'a-sale', label: 'Voir les promotions', icon: Percent, run: () => go('/boutique?sale=1') },
        { type: 'action', key: 'a-track', label: 'Suivre une commande', icon: PackageSearch, run: () => go('/track-order') },
        { type: 'action', key: 'a-cart', label: 'Ouvrir mon panier', icon: ShoppingBag, run: () => go('/panier') },
      ];
    }
    const matchedProducts = products.filter((p) => productMatchesQuery(p, clean)).slice(0, 6);
    const matchedCategories = categories.filter((c) => normalizeText(c.name).includes(normalizeText(clean))).slice(0, 3);
    return [
      ...matchedProducts.map((product) => ({ type: 'product', key: `p-${product.id}`, product, run: () => go(getProductPath(product), clean) })),
      ...matchedCategories.map((category) => ({ type: 'category', key: `c-${category.name}`, category, run: () => go(`/category/${slugify(category.name)}`, clean) })),
      { type: 'all', key: 'all', label: `Tous les résultats pour « ${clean} »`, run: () => go(`/boutique?q=${encodeURIComponent(clean)}`, clean) },
    ];
    // go is stable enough for this render; it only closes over navigate/onClose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, recent, products, categories]);

  function go(path, term) {
    if (term) addRecentSearch(term);
    onClose();
    navigate(path);
  }

  useEffect(() => { setActive(0); }, [clean]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') { onClose(); return; }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    if (event.key === 'Enter') { event.preventDefault(); items[active]?.run(); }
  };

  const rowClass = (i) =>
    `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
      i === active ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/[0.04]'
    }`;

  let rowIndex = -1;
  const nextIndex = () => { rowIndex += 1; return rowIndex; };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/25 px-3 pt-[9vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Recherche"
        >
          <motion.div
            className="liquid-glass w-full max-w-2xl overflow-hidden rounded-[28px]"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-center gap-3 border-b border-foreground/10 px-5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Rechercher un téléphone, une coque, un chargeur…"
                className="h-16 w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
                aria-activedescendant={items[active]?.key}
              />
              <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5" aria-label="Fermer la recherche">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
              {clean.length < 1 ? (
                <>
                  {recent.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-3 pb-1 pt-2">
                        <p className="text-xs font-medium text-muted-foreground">Recherches récentes</p>
                        <button type="button" onClick={() => { clearRecentSearches(); setRecent([]); }} className="text-xs text-muted-foreground hover:text-foreground">
                          Effacer
                        </button>
                      </div>
                      {recent.map((term) => {
                        const i = nextIndex();
                        return (
                          <button key={term} type="button" data-index={i} onMouseEnter={() => setActive(i)} onClick={() => items[i].run()} className={rowClass(i)}>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm text-foreground">{term}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {categories.length > 0 && (
                    <div className="px-3 pb-3 pt-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Tendances</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 8).map(({ name, icon }) => {
                          const Icon = icon ? ICON_COMPONENTS[icon] : null;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => go(`/category/${slugify(name)}`)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/60 px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                            >
                              {Icon && <Icon className="h-3.5 w-3.5" />}
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">Raccourcis</p>
                  {items.filter((item) => item.type === 'action').map((item) => {
                    const i = nextIndex();
                    const Icon = item.icon;
                    return (
                      <button key={item.key} type="button" data-index={i} onMouseEnter={() => setActive(i)} onClick={item.run} className={rowClass(i)}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm text-foreground">{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {items.filter((item) => item.type === 'product').length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun produit ne correspond. Essayez un autre mot.</p>
                  )}
                  {items.map((item) => {
                    const i = nextIndex();
                    if (item.type === 'product') {
                      const { product } = item;
                      return (
                        <button key={item.key} id={item.key} type="button" data-index={i} onMouseEnter={() => setActive(i)} onClick={item.run} className={rowClass(i)}>
                          <span className="photo-well flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                            {product.image_url ? (
                              <img src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'pad' })} alt="" className="h-full w-full bg-transparent object-contain p-1 mix-blend-multiply" />
                            ) : (
                              <Package className="h-5 w-5 opacity-40" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground"><Highlight text={product.name} query={clean} /></span>
                            <span className="text-xs text-muted-foreground">
                              {product.category} · {product.status === 'out_of_stock' ? 'Épuisé' : 'En stock'}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-foreground">{formatMoney(product.price)}</span>
                        </button>
                      );
                    }
                    if (item.type === 'category') {
                      const Icon = item.category.icon ? ICON_COMPONENTS[item.category.icon] : Package;
                      return (
                        <button key={item.key} id={item.key} type="button" data-index={i} onMouseEnter={() => setActive(i)} onClick={item.run} className={rowClass(i)}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                          <span className="flex-1 text-sm text-foreground">Catégorie <span className="font-medium">{item.category.name}</span></span>
                        </button>
                      );
                    }
                    return (
                      <button key={item.key} id={item.key} type="button" data-index={i} onMouseEnter={() => setActive(i)} onClick={item.run} className={rowClass(i)}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background"><Search className="h-4 w-4" /></span>
                        <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div className="hidden items-center gap-4 border-t border-foreground/10 px-5 py-2.5 text-[11px] text-muted-foreground sm:flex">
              <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/15 px-1">↑</kbd><kbd className="rounded border border-foreground/15 px-1">↓</kbd> naviguer</span>
              <span className="flex items-center gap-1"><kbd className="flex items-center rounded border border-foreground/15 px-1"><CornerDownLeft className="h-3 w-3" /></kbd> ouvrir</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-foreground/15 px-1">esc</kbd> fermer</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
