import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  CirclePlus,
  Command,
  LayoutGrid,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const VIEW_ACTIONS = [
  { id: 'dashboard', label: 'Tableau de bord', hint: 'Voir les ventes et alertes', icon: BarChart2, view: 'dashboard' },
  { id: 'orders', label: 'Commandes', hint: 'Suivre les commandes clients', icon: ShoppingBag, view: 'orders' },
  { id: 'products', label: 'Produits', hint: 'Gérer le catalogue', icon: LayoutGrid, view: 'products' },
  { id: 'add', label: 'Ajouter un produit', hint: 'Créer une nouvelle fiche', icon: CirclePlus, view: 'add' },
  { id: 'categories', label: 'Catégories', hint: 'Organiser la navigation', icon: Tag, view: 'categories' },
  { id: 'hero', label: 'Hero Section', hint: 'Gérer le slider boutique', icon: SlidersHorizontal, view: 'hero' },
];

export default function AdminCommandPalette({ onViewChange, onEditProduct }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    enabled: open,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list(),
    enabled: open,
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const actions = useMemo(() => {
    const productActions = products.slice(0, 40).map((product) => ({
      id: `product-${product.id}`,
      label: product.name,
      hint: `${product.category || 'Sans catégorie'} · ${Number(product.price || 0).toLocaleString('fr-MA')} MAD`,
      icon: Package,
      run: () => onEditProduct(product),
    }));

    const orderActions = orders.slice(0, 20).map((order) => ({
      id: `order-${order.id}`,
      label: order.customer_name || 'Commande',
      hint: `${order.customer_phone || ''} · ${Number(order.total || 0).toLocaleString('fr-MA')} MAD`,
      icon: ShoppingBag,
      run: () => onViewChange('orders'),
    }));

    return [
      ...VIEW_ACTIONS.map((action) => ({
        ...action,
        run: () => onViewChange(action.view),
      })),
      ...productActions,
      ...orderActions,
    ];
  }, [onEditProduct, onViewChange, orders, products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions.slice(0, 12);
    return actions
      .filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(needle))
      .slice(0, 16);
  }, [actions, query]);

  const runAction = (action) => {
    action.run();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 hidden items-center gap-2 rounded-lg border border-white/10 bg-[#0d1426]/95 px-3 py-2 text-xs font-semibold text-slate-400 shadow-lg shadow-black/20 backdrop-blur transition-colors hover:text-white lg:flex"
      >
        <Command className="h-3.5 w-3.5" />
        Ctrl K
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 px-3 py-16 backdrop-blur-sm sm:px-6" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0d1426] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une action, un produit ou une commande..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">Aucun résultat</div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runAction(action)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{action.label}</span>
                    <span className="block truncate text-xs text-slate-500">{action.hint}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
