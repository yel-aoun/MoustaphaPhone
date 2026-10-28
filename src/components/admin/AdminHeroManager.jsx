import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useHeroConfig, readLegacyLocalHeroConfig, clearLegacyLocalHeroConfig } from '@/lib/heroStore';
import {
  GripVertical, Trash2, ChevronUp, ChevronDown,
  Search, Plus, Save, Image, RotateCcw, Info, MonitorSmartphone, ShoppingCart, Loader2, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cloudinaryImage } from '@/lib/images';
import { formatMoney } from '@/lib/products';
import { storeBrand } from '@/lib/brand';

export default function AdminHeroManager() {
  const { config, save, isLoading } = useHeroConfig();

  // Local editable state (only committed when "Save" is clicked)
  const [defaultTitle, setDefaultTitle] = useState(config.defaultTitle);
  const [defaultSubtitle, setDefaultSubtitle] = useState(config.defaultSubtitle);
  const [slides, setSlides] = useState(config.slides);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [legacyConfig, setLegacyConfig] = useState(null);
  const seededRef = useRef(false);

  // The saved config arrives from the server after mount; load it into the form once.
  useEffect(() => {
    if (isLoading || seededRef.current) return;
    seededRef.current = true;
    setDefaultTitle(config.defaultTitle);
    setDefaultSubtitle(config.defaultSubtitle);
    setSlides(config.slides);
    if (config.slides.length === 0) {
      const legacy = readLegacyLocalHeroConfig();
      if (legacy) setLegacyConfig(legacy);
    }
  }, [isLoading, config]);

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const activeProducts = allProducts.filter((p) => p.status !== 'inactive');

  // Products not yet in slides
  const availableProducts = useMemo(() => {
    const usedIds = new Set(slides.map((s) => s.productId));
    return activeProducts.filter(
      (p) =>
        !usedIds.has(p.id) &&
        (productSearch === '' ||
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [activeProducts, slides, productSearch]);

  const addSlide = (product) => {
    setSlides((prev) => [
      ...prev,
      { productId: product.id },
    ]);
    setProductSearch('');
  };

  const removeSlide = (idx) =>
    setSlides((prev) => prev.filter((_, i) => i !== idx));

  const moveSlide = (idx, dir) => {
    setSlides((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        defaultTitle,
        defaultSubtitle,
        slides: slides.map((slide) => ({ productId: slide.productId })),
      });
      clearLegacyLocalHeroConfig();
      setLegacyConfig(null);
      toast.success('Hero section sauvegardée — visible par tous les visiteurs.');
    } catch (error) {
      toast.error(`Sauvegarde impossible : ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const loadLegacyConfig = () => {
    if (!legacyConfig) return;
    setDefaultTitle(legacyConfig.defaultTitle);
    setDefaultSubtitle(legacyConfig.defaultSubtitle);
    setSlides(legacyConfig.slides);
    toast.info('Sélection récupérée — cliquez sur Sauvegarder pour la publier.');
  };

  const handleReset = () => {
    setDefaultTitle(config.defaultTitle);
    setDefaultSubtitle(config.defaultSubtitle);
    setSlides(config.slides);
  };

  // Map productId → product object for slide display
  const productMap = useMemo(
    () => Object.fromEntries(allProducts.map((p) => [p.id, p])),
    [allProducts]
  );

  const previewProduct = useMemo(() => {
    const configured = slides.map((slide) => productMap[slide.productId]).find(Boolean);
    return configured || activeProducts[0] || null;
  }, [activeProducts, productMap, slides]);

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Hero Section</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Personnalisez le message fixe et choisissez les produits qui défilent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400 hover:text-white text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || isLoading} className="bg-primary hover:bg-primary/90 text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {legacyConfig && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-100">
            Une ancienne sélection de {legacyConfig.slides.length} produit{legacyConfig.slides.length > 1 ? 's' : ''} est
            enregistrée uniquement dans ce navigateur. Les visiteurs ne la voient pas encore.
          </p>
          <Button size="sm" variant="outline" onClick={loadLegacyConfig} className="shrink-0 border-amber-400/40 text-amber-100 hover:bg-amber-500/20">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Récupérer
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de la configuration…
        </div>
      )}

      {/* Default message */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-white">Message fixe du hero</h3>
          <span className="text-xs text-slate-400">— reste visible pendant que les produits défilent</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Titre</label>
            <Input
              value={defaultTitle}
              onChange={(e) => setDefaultTitle(e.target.value)}
              placeholder="La tech de 2026, livrée chez vous."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sous-titre</label>
            <Input
              value={defaultSubtitle}
              onChange={(e) => setDefaultSubtitle(e.target.value)}
              placeholder="Smartphones, coques et accessoires originaux, livrés partout au Maroc."
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
            />
          </div>
        </div>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <MonitorSmartphone className="w-4 h-4 text-primary" />
          Aperçu boutique
        </h3>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d14]">
          <div className="grid min-h-[260px] gap-4 p-5 sm:grid-cols-[1fr_220px] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{storeBrand.name}</p>
              <h4 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {defaultTitle || `Hero ${storeBrand.name}`}
              </h4>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {defaultSubtitle || 'Ajoutez un sous-titre pour présenter la sélection.'}
              </p>
              <div className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
                <ShoppingCart className="h-4 w-4" />
                Découvrir
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              {previewProduct?.image_url ? (
                <img
                  src={cloudinaryImage(previewProduct.image_url, { width: 420, height: 420, crop: 'pad' })}
                  alt={previewProduct.name}
                  className="h-40 w-full object-contain sm:h-48"
                />
              ) : (
                <div className="flex h-40 items-center justify-center text-slate-300 sm:h-48">
                  <Image className="h-10 w-10" />
                </div>
              )}
              <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-950">
                {previewProduct?.name || 'Produit aperçu'}
              </p>
              <p className="mt-1 font-mono text-lg font-extrabold text-primary">
                {previewProduct ? formatMoney(previewProduct.price) : '0 MAD'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — product picker */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Ajouter un produit au slider
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm focus-visible:ring-primary/40"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {availableProducts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                {slides.length >= activeProducts.length
                  ? 'Tous les produits sont déjà dans le slider.'
                  : 'Aucun produit trouvé.'}
              </p>
            )}
            {availableProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addSlide(product)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
              >
                {product.image_url ? (
                  <img
                    src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'fill' })}
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white/5"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Image className="w-4 h-4 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.category} · {product.price?.toLocaleString()} MAD</p>
                </div>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Right — slides order */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-primary" />
            Slides ({slides.length})
          </h3>

          {slides.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
              <Image className="w-8 h-8 opacity-30" />
              <p className="text-xs">Aucun slide configuré. Ajoutez des produits depuis la liste.</p>
            </div>
          )}

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {slides.map((slide, idx) => {
              const product = productMap[slide.productId];
              if (!product) return null;
              return (
                <div
                  key={slide.productId}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5"
                >
                  {/* Slide header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono w-5 shrink-0 text-center">{idx + 1}</span>
                    {product.image_url ? (
                      <img
                        src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'fill' })}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 bg-white/5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Image className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-400">{product.price?.toLocaleString()} MAD</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveSlide(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSlide(idx, 1)}
                        disabled={idx === slides.length - 1}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeSlide(idx)}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Preview note */}
      <p className="text-xs text-slate-500 text-center">
        Si aucun slide n'est configuré, le slider utilise automatiquement les produits en promotion et les nouveautés.
      </p>
    </div>
  );
}
