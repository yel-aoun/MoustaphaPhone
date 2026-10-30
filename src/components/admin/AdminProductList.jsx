import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  CheckSquare,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  PackageOpen,
  Pencil,
  Rows3,
  Search,
  ShoppingBag,
  Square,
  Table2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PRODUCT_CATEGORY_FILTERS } from '@/lib/productCategories';
import { toast } from 'sonner';
import AdminCatalogTools from '@/components/admin/AdminCatalogTools';
import { cloudinaryImage } from '@/lib/images';

const STATUS_CONFIG = {
  active: { label: 'Actif', icon: Eye, className: 'text-emerald-400 bg-emerald-500/10' },
  inactive: { label: 'Inactif', icon: EyeOff, className: 'text-slate-400 bg-slate-500/10' },
  out_of_stock: { label: 'Rupture', icon: ShoppingBag, className: 'text-orange-400 bg-orange-500/10' },
};

const QUALITY_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'needs_work', label: 'À compléter' },
  { id: 'missing_image', label: 'Sans image' },
  { id: 'missing_description', label: 'Description courte' },
  { id: 'inactive', label: 'Masqués' },
  { id: 'out_of_stock', label: 'Rupture' },
];

function productPayload(product, overrides = {}) {
  return {
    name: product.name,
    price: product.price,
    original_price: product.original_price ?? null,
    category: product.category,
    status: product.status || 'active',
    image_url: product.image_url || '',
    extra_images: Array.isArray(product.extra_images) ? product.extra_images : [],
    description: product.description || '',
    colors: Array.isArray(product.colors) ? product.colors : [],
    specs: Array.isArray(product.specs) ? product.specs : [],
    badges: Array.isArray(product.badges) ? product.badges : [],
    ...overrides,
  };
}

function needsWork(product) {
  return !product.image_url || !String(product.description || '').trim() || String(product.description || '').trim().length < 40;
}

function qualityScore(product) {
  const checks = [
    Boolean(product.image_url),
    String(product.description || '').trim().length >= 40,
    Boolean(product.category),
    Number(product.price) > 0,
    Array.isArray(product.specs) && product.specs.length > 0,
    Array.isArray(product.badges) && product.badges.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

export default function AdminProductList({ onEdit, editingProductId }) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [draftPrice, setDraftPrice] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'Tous' || p.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesQuality =
        qualityFilter === 'all' ||
        (qualityFilter === 'needs_work' && needsWork(p)) ||
        (qualityFilter === 'missing_image' && !p.image_url) ||
        (qualityFilter === 'missing_description' && (!p.description || p.description.trim().length < 40)) ||
        (qualityFilter === 'inactive' && p.status === 'inactive') ||
        (qualityFilter === 'out_of_stock' && p.status === 'out_of_stock');
      return matchesCategory && matchesSearch && matchesQuality;
    });
  }, [products, activeCategory, searchQuery, qualityFilter]);

  const categoryCounts = useMemo(
    () =>
      PRODUCT_CATEGORY_FILTERS.reduce((counts, category) => {
        counts[category] =
          category === 'Tous'
            ? products.length
            : products.filter((p) => p.category === category).length;
        return counts;
      }, {}),
    [products]
  );

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedIds.includes(product.id)),
    [products, selectedIds]
  );

  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const toggleSelect = (id) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };

  const setProductStatus = async (product, status) => {
    setSavingId(product.id);
    try {
      await base44.entities.Product.update(product.id, productPayload(product, { status }));
      refreshProducts();
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error(error.message || 'Impossible de mettre à jour le statut');
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkStatus = async (status) => {
    if (selectedProducts.length === 0) return;
    setBulkSaving(true);
    try {
      for (const product of selectedProducts) {
        await base44.entities.Product.update(product.id, productPayload(product, { status }));
      }
      setSelectedIds([]);
      refreshProducts();
      toast.success(`${selectedProducts.length} produit(s) mis à jour`);
    } catch (error) {
      toast.error(error.message || 'Action groupée impossible');
    } finally {
      setBulkSaving(false);
    }
  };

  const duplicateProduct = async (product) => {
    setSavingId(product.id);
    try {
      const payload = productPayload(product, {
        name: `${product.name} (copie)`,
        status: 'inactive',
      });
      await base44.entities.Product.create(payload);
      refreshProducts();
      toast.success('Produit dupliqué en brouillon');
    } catch (error) {
      toast.error(error.message || 'Duplication impossible');
    } finally {
      setSavingId(null);
    }
  };

  const saveDraftPrice = async (product) => {
    if (editingPriceId !== product.id) return;
    const nextPrice = Number(draftPrice);
    if (!nextPrice || Number.isNaN(nextPrice)) {
      setEditingPriceId(null);
      return;
    }
    setSavingId(product.id);
    try {
      await base44.entities.Product.update(product.id, productPayload(product, { price: nextPrice }));
      refreshProducts();
      toast.success('Prix mis à jour');
    } catch (error) {
      toast.error(error.message || 'Prix non mis à jour');
    } finally {
      setSavingId(null);
      setEditingPriceId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await base44.entities.Product.delete(deletingProduct.id);
      refreshProducts();
      toast.success(`"${deletingProduct.name}" supprimé`);
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-5">
        <AdminCatalogTools products={products} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-12 text-slate-400">
          <PackageOpen className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun produit encore</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <AdminCatalogTools products={products} />
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_20px_70px_rgba(2,6,23,0.35)] sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white sm:text-2xl">Produits</h3>
          <div className="flex items-center gap-2">
            <p className="hidden text-sm text-slate-400 sm:block">
              {filteredProducts.length} affiché{filteredProducts.length > 1 ? 's' : ''}
            </p>
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors ${
                  viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table2 className="h-3.5 w-3.5" />
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="pl-9 h-10 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-primary">
              {selectedIds.length} produit{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              {[
                ['active', 'Activer'],
                ['inactive', 'Masquer'],
                ['out_of_stock', 'Rupture'],
              ].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  disabled={bulkSaving}
                  onClick={() => handleBulkStatus(status)}
                  className="h-8 rounded-lg border border-primary/25 bg-background px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category filters */}
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {PRODUCT_CATEGORY_FILTERS.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-primary/40 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {category} ({categoryCounts[category] ?? 0})
              </button>
            );
          })}
        </div>

        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {QUALITY_FILTERS.map((filter) => {
            const isActive = qualityFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setQualityFilter(filter.id)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-orange-400/50 bg-orange-500/12 text-orange-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Product list */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#131c31]/70 py-12 text-slate-400">
            <PackageOpen className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : `Aucun produit dans ${activeCategory}`}
            </p>
          </div>
        ) : (
          viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-12 px-3 py-3"></th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Catégorie</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Prix</th>
                  <th className="px-3 py-3">Qualité</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((p) => {
                  const score = qualityScore(p);
                  return (
                    <tr key={p.id} className={editingProductId === p.id ? 'bg-primary/10' : 'bg-[#131c31]/55'}>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(p.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {selectedIds.includes(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={cloudinaryImage(p.image_url)} alt={p.name} className="h-10 w-10 rounded-lg bg-white object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                              <PackageOpen className="h-4 w-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-semibold text-white">{p.name}</p>
                            {needsWork(p) && <p className="mt-0.5 text-xs text-orange-300">À compléter</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-400">{p.category || '-'}</td>
                      <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-white">
                        {editingPriceId === p.id ? (
                          <input
                            value={draftPrice}
                            onChange={(event) => setDraftPrice(event.target.value)}
                            onBlur={() => saveDraftPrice(p)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') saveDraftPrice(p);
                              if (event.key === 'Escape') setEditingPriceId(null);
                            }}
                            autoFocus
                            className="h-8 w-24 rounded-2xl border border-white/10 bg-white/[0.06] px-2 text-right font-mono text-sm text-white outline-none focus:border-primary/50"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setDraftPrice(String(p.price || ''));
                            }}
                            className="rounded-md px-1 transition-colors hover:bg-white/10"
                          >
                            {p.price?.toLocaleString()} MAD
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-white/[0.08]">
                            <div
                              className={`h-1.5 rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-orange-400' : 'bg-red-400'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-slate-400">{score}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setProductStatus(p, p.status === 'active' ? 'inactive' : 'active')} className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white">
                            {p.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => duplicateProduct(p)} aria-label="Dupliquer le produit" className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onEdit?.(p)} aria-label="Modifier le produit" className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingProduct(p)} aria-label="Supprimer le produit" className="h-8 w-8 text-slate-500 hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          ) : (
          <div className="space-y-3">
            {filteredProducts.map((p) => {
              const discount =
                p.original_price && p.original_price > p.price
                  ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                  : null;
              const score = qualityScore(p);

              return (
                <div
                  key={p.id}
                  className={`flex flex-col gap-3 rounded-2xl border p-3 transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
                    editingProductId === p.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-white/10 bg-[#131c31]/80'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => toggleSelect(p.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label={selectedIds.includes(p.id) ? 'Désélectionner' : 'Sélectionner'}
                    >
                      {selectedIds.includes(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>

                    {p.image_url ? (
                      <img src={cloudinaryImage(p.image_url, { width: 160, height: 160, crop: 'fill' })} alt={p.name} className="h-14 w-14 shrink-0 rounded-xl bg-white object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                        <PackageOpen className="h-5 w-5 text-slate-500" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-white sm:line-clamp-1">{p.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-xs text-slate-400">{p.category}</span>
                        <StatusBadge status={p.status} />
                        {discount !== null && (
                          <span className="inline-flex items-center rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-400">
                            -{discount}%
                          </span>
                        )}
                        {needsWork(p) && (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            À compléter
                          </span>
                        )}
                        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          score >= 80 ? 'bg-emerald-500/10 text-emerald-300' : score >= 60 ? 'bg-orange-500/10 text-orange-300' : 'bg-red-500/10 text-red-300'
                        }`}>
                          Qualité {score}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 max-w-xs rounded-full bg-white/[0.06]">
                        <div
                          className={`h-1.5 rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-orange-400' : 'bg-red-400'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 sm:justify-end sm:border-0 sm:pt-0">
                    <div className="shrink-0 sm:text-right">
                      {editingPriceId === p.id ? (
                        <input
                          value={draftPrice}
                          onChange={(event) => setDraftPrice(event.target.value)}
                          onBlur={() => saveDraftPrice(p)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') saveDraftPrice(p);
                            if (event.key === 'Escape') setEditingPriceId(null);
                          }}
                          autoFocus
                          inputMode="decimal"
                          className="h-8 w-24 rounded-2xl border border-white/10 bg-white/[0.06] px-2 text-right font-mono text-base text-white outline-none focus:border-primary/50 sm:text-sm"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceId(p.id);
                            setDraftPrice(String(p.price || ''));
                          }}
                          className="whitespace-nowrap rounded-md px-1 text-sm font-semibold text-white font-mono transition-colors hover:bg-white/10"
                        >
                          {p.price?.toLocaleString()} MAD
                        </button>
                      )}
                      {p.original_price ? (
                        <p className="whitespace-nowrap px-1 text-xs text-slate-500 line-through font-mono">{p.original_price?.toLocaleString()} MAD</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const nextStatus = p.status === 'active' ? 'inactive' : 'active';
                          setProductStatus(p, nextStatus);
                        }}
                        disabled={savingId === p.id}
                        className="text-slate-400 hover:bg-white/10 hover:text-white"
                        aria-label={p.status === 'active' ? 'Masquer le produit' : 'Activer le produit'}
                      >
                        {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateProduct(p)}
                        disabled={savingId === p.id}
                        className="text-slate-400 hover:bg-white/10 hover:text-white"
                        aria-label="Dupliquer le produit"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(p)}
                        className="text-slate-400 hover:bg-white/10 hover:text-white"
                        aria-label="Modifier le produit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProduct(p)}
                        className="text-slate-500 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Supprimer le produit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent className="border-white/10 bg-[#111a30] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              <span className="font-semibold text-slate-300">"{deletingProduct?.name}"</span> sera définitivement
              supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
