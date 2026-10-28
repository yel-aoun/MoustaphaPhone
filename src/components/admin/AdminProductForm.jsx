import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, X, Upload, ImagePlus, Flame, Palette, ListChecks, ArrowLeft, ArrowRight, AlertTriangle, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';

const fieldClassName = 'h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary/40';

const PRODUCT_STATUSES = [
  { value: 'active', label: 'Actif — visible en boutique' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
  { value: 'inactive', label: 'Inactif — masqué de la boutique' },
];

const PRODUCT_BADGES = [
  { value: 'best_seller', label: 'Best seller' },
  { value: 'new_arrival', label: 'Nouveau' },
  { value: 'limited_stock', label: 'Stock limité' },
  { value: 'recommended', label: 'Recommandé' },
];

const createEmptyForm = () => ({
  name: '',
  originalPrice: '',
  salePrice: '',
  category: '',
  status: 'active',
  description: '',
  images: [],
  colors: [],
  specs: [],
  badges: [],
});

const productToForm = (product) => ({
  name: product?.name || '',
  originalPrice: product?.original_price?.toString() || product?.price?.toString() || '',
  salePrice: product?.original_price ? product?.price?.toString() || '' : '',
  category: product?.category || '',
  status: product?.status || 'active',
  description: product?.description || '',
  images: [product?.image_url, ...(product?.extra_images || [])]
    .filter(Boolean)
    .map((url) => ({ preview: url, file: null, url })),
  colors: Array.isArray(product?.colors)
    ? product.colors.map((c) => ({
        ...c,
        imageIndices: Array.isArray(c.imageIndices) ? c.imageIndices : [],
      }))
    : [],
  specs: Array.isArray(product?.specs)
    ? product.specs.map((spec) => ({ name: spec.name || '', value: spec.value || '' }))
    : [],
  badges: Array.isArray(product?.badges) ? product.badges : [],
});

function upsertProductInCache(current = [], savedProduct) {
  if (!savedProduct?.id) return current;
  const exists = current.some((item) => item.id === savedProduct.id);
  if (exists) {
    return current.map((item) => (item.id === savedProduct.id ? savedProduct : item));
  }
  return [savedProduct, ...current];
}

export default function AdminProductForm({ product, onSaved, onCancel, onStayEditing }) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [loading, setLoading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [form, setForm] = useState(() => (product ? productToForm(product) : createEmptyForm()));
  const isEditing = Boolean(product?.id);

  useEffect(() => {
    setForm(product ? productToForm(product) : createEmptyForm());
    setUploadingIdx(null);
  }, [product]);

  // Derived values
  const originalPrice = parseFloat(form.originalPrice) || 0;
  const salePrice = parseFloat(form.salePrice) || 0;
  const hasDiscount = form.salePrice !== '' && salePrice > 0 && originalPrice > salePrice;
  const discountPct = hasDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      preview: URL.createObjectURL(file),
      file,
      url: null,
    }));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    e.target.value = '';
  };

  const handleAddUrl = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { preview: null, file: null, url: '' }],
    }));
  };

  const handleUrlChange = (idx, value) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[idx] = { ...images[idx], url: value, preview: value };
      return { ...prev, images };
    });
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (idx, direction) => {
    setForm((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const images = [...prev.images];
      [images[idx], images[target]] = [images[target], images[idx]];
      return { ...prev, images };
    });
  };

  // Colors
  const addColor = () => {
    setForm((prev) => ({ ...prev, colors: [...prev.colors, { name: '', hex: '#000000', imageIndices: [] }] }));
  };

  const updateColor = (idx, field, value) => {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[idx] = { ...colors[idx], [field]: value };
      return { ...prev, colors };
    });
  };

  const removeColor = (idx) => {
    setForm((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };

  const addSpec = () => {
    setForm((prev) => ({ ...prev, specs: [...prev.specs, { name: '', value: '' }] }));
  };

  const updateSpec = (idx, field, value) => {
    setForm((prev) => {
      const specs = [...prev.specs];
      specs[idx] = { ...specs[idx], [field]: value };
      return { ...prev, specs };
    });
  };

  const removeSpec = (idx) => {
    setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== idx) }));
  };

  const toggleBadge = (badge) => {
    setForm((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter((item) => item !== badge)
        : [...prev.badges, badge].slice(0, 4),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitAction = e.nativeEvent?.submitter?.value || 'return';
    setLoading(true);

    try {
      const resolvedUrls = [];
      for (let i = 0; i < form.images.length; i++) {
        const img = form.images[i];
        if (img.file) {
          setUploadingIdx(i);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: img.file });
          resolvedUrls.push(file_url);
        } else if (img.url) {
          resolvedUrls.push(img.url);
        }
      }
      setUploadingIdx(null);

      const [mainImage, ...extraImages] = resolvedUrls;

      const validColors = form.colors.filter((c) => c.name.trim() && c.hex);
      const validSpecs = form.specs
        .map((spec) => ({ name: spec.name.trim(), value: spec.value.trim() }))
        .filter((spec) => spec.name && spec.value);

      const payload = {
        name: form.name,
        price: hasDiscount ? Math.round(salePrice * 100) / 100 : originalPrice,
        original_price: hasDiscount ? originalPrice : null,
        category: form.category,
        status: form.status,
        image_url: mainImage || '',
        extra_images: extraImages,
        description: form.description,
        colors: validColors,
        specs: validSpecs,
        badges: form.badges,
      };

      let savedProduct;
      if (isEditing) {
        savedProduct = await base44.entities.Product.update(product.id, payload);
        toast.success('Produit mis à jour avec succès');
      } else {
        savedProduct = await base44.entities.Product.create(payload);
        toast.success('Produit ajouté avec succès');
      }

      queryClient.setQueryData(['admin-products'], (current = []) => upsertProductInCache(current, savedProduct));
      queryClient.setQueryData(['products'], (current = []) => upsertProductInCache(current, savedProduct));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
      if (submitAction === 'stay') {
        setForm(productToForm(savedProduct));
        onStayEditing?.(savedProduct);
      } else {
        setForm(createEmptyForm());
        onSaved?.(savedProduct);
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setUploadingIdx(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/12 bg-white/[0.05] p-6 shadow-[0_20px_70px_rgba(2,6,23,0.45)] backdrop-blur-sm sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-3xl font-semibold tracking-tight text-white">
            {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {isEditing
              ? 'Mettez a jour le prix, la description, les images ou la categorie.'
              : 'Renseignez les details du produit avant publication.'}
          </p>
        </div>
        {isEditing && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Annuler
          </button>
        ) : null}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-300">Nom du produit</Label>
        <Input
          required
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className={fieldClassName}
          placeholder="Casque Bluetooth Pro"
        />
      </div>

      {/* Category + Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">Catégorie</Label>
          <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder="Choisir une catégorie" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111a30] text-white">
              {categories.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">Statut</Label>
          <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
            <SelectTrigger className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#111a30] text-white">
              {PRODUCT_STATUSES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">
          Images du produit <span className="text-xs text-slate-500">(la 1ère est l'image principale)</span>
        </Label>

        {form.images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative group">
                {img.file ? (
                  <div
                    className={`aspect-square overflow-hidden rounded-xl border ${
                      idx === 0 ? 'border-primary/70' : 'border-white/10'
                    } bg-[#131c31]`}
                  >
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0d1017]/80">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`relative aspect-square overflow-hidden rounded-xl border ${
                      idx === 0 ? 'border-primary/70' : 'border-white/10'
                    } bg-[#131c31]`}
                  >
                    {img.url ? (
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImagePlus className="h-6 w-6 text-slate-500" />
                      </div>
                    )}
                    <input
                      type="text"
                      value={img.url || ''}
                      onChange={(e) => handleUrlChange(idx, e.target.value)}
                      placeholder="https://..."
                      className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0d1017]/95 px-2 py-1 text-[10px] text-slate-200 outline-none placeholder:text-slate-500"
                    />
                  </div>
                )}
                {idx === 0 && (
                  <span className="absolute -top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Main
                  </span>
                )}
                {img.file && img.file.size > 900_000 && (
                  <span className="absolute bottom-8 left-1 right-1 flex items-center justify-center gap-1 rounded-md bg-orange-500/90 px-1 py-0.5 text-[9px] font-semibold text-white">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    grande image
                  </span>
                )}
                <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d1017]/90 text-white disabled:opacity-30"
                    aria-label="Déplacer l'image vers la gauche"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === form.images.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d1017]/90 text-white disabled:opacity-30"
                    aria-label="Déplacer l'image vers la droite"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-sm font-medium text-slate-300 transition-colors hover:border-primary/40 hover:text-white">
            <Upload className="h-4 w-4" />
            Importer des fichiers
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleAddUrl}
            className="flex h-11 items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-sm font-medium text-slate-300 transition-colors hover:border-primary/40 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            URL
          </button>
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-slate-400" />
            Fiche technique
            <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-primary/40 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
        {form.specs.length > 0 ? (
          <div className="space-y-2">
            {form.specs.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={spec.name}
                  onChange={(e) => updateSpec(idx, 'name', e.target.value)}
                  placeholder="Ex : Connectivité"
                  className="h-9 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 text-sm"
                />
                <Input
                  value={spec.value}
                  onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                  placeholder="Ex : Bluetooth"
                  className="h-9 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(idx)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-destructive/20 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-center text-xs text-slate-600">
            Ajoutez des specs comme compatibilité, connectivité, batterie, garantie ou layout.
          </p>
        )}
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            Couleurs disponibles
            <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <button
            type="button"
            onClick={addColor}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-primary/40 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une couleur
          </button>
        </div>

        {form.colors.length > 0 && (
          <div className="space-y-2">
            {form.colors.map((color, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 space-y-2.5">
                {/* Row 1: swatch + name + hex + remove */}
                <div className="flex items-center gap-3">
                  {/* Color picker */}
                  <label
                    className="relative w-9 h-9 rounded-full cursor-pointer shrink-0 border-2 border-white/20 overflow-hidden shadow-md"
                    style={{ backgroundColor: color.hex }}
                  >
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  {/* Color name */}
                  <Input
                    value={color.name}
                    onChange={(e) => updateColor(idx, 'name', e.target.value)}
                    placeholder="Ex : Blanc, Noir, Rouge…"
                    className="flex-1 h-8 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 text-sm"
                  />
                  {/* Hex display */}
                  <span className="font-mono text-xs text-slate-500 hidden sm:block w-16 text-right">{color.hex}</span>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-destructive/20 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Row 2: image picker (multi-select) */}
                {form.images.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500">
                      Images de cette couleur{' '}
                      <span className="text-slate-600">(cliquez pour sélectionner / désélectionner)</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {form.images.map((img, imgIdx) => {
                        const src = img.preview || img.url;
                        const linked = Array.isArray(color.imageIndices) ? color.imageIndices : [];
                        const isLinked = linked.includes(imgIdx);
                        const toggle = () => {
                          const next = isLinked
                            ? linked.filter((n) => n !== imgIdx)
                            : [...linked, imgIdx].sort((a, b) => a - b);
                          updateColor(idx, 'imageIndices', next);
                        };
                        return (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={toggle}
                            className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                              isLinked
                                ? 'border-primary shadow-[0_0_0_2px_rgba(124,58,237,0.3)] scale-105'
                                : 'border-white/10 opacity-50 hover:opacity-80'
                            }`}
                          >
                            {src ? (
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <ImagePlus className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                            {isLinked && (
                              <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {(Array.isArray(color.imageIndices) ? color.imageIndices : []).length === 0 ? (
                      <p className="text-[10px] text-slate-600">Aucune sélectionnée — toutes les images seront affichées.</p>
                    ) : (
                      <p className="text-[10px] text-primary/70">
                        {color.imageIndices.length} image{color.imageIndices.length > 1 ? 's' : ''} liée{color.imageIndices.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {form.colors.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-2">
            Aucune couleur — le sélecteur ne sera pas affiché en boutique.
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Badges boutique
          <span className="text-xs text-slate-500">(optionnel)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRODUCT_BADGES.map((badge) => {
            const active = form.badges.includes(badge.value);
            return (
              <button
                key={badge.value}
                type="button"
                onClick={() => toggleBadge(badge.value)}
                className={`h-9 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/15 text-primary'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-300">Prix</Label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Prix original (MAD)</p>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
              className={`${fieldClassName} font-mono`}
              placeholder="1000"
            />
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Flame className="h-3 w-3 text-orange-400" />
              Nouveau prix après réduction (MAD) — optionnel
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
              className={`${fieldClassName} font-mono`}
              placeholder="Laisser vide si pas de promo"
            />
          </div>
        </div>

        {/* Price preview */}
        {form.originalPrice && (
          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              hasDiscount
                ? 'border border-orange-500/20 bg-orange-500/10'
                : 'border border-white/10 bg-white/[0.03]'
            }`}
          >
            {hasDiscount ? (
              <>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400 shrink-0" />
                  <p className="text-sm text-orange-300">
                    Réduction de <span className="font-bold text-orange-200">{discountPct}%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-white text-base">
                    {salePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} MAD
                  </p>
                  <p className="font-mono text-xs text-slate-500 line-through">
                    {originalPrice.toLocaleString()} MAD
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">Prix affiché en boutique</p>
                <p className="font-mono font-bold text-white">{originalPrice.toLocaleString()} MAD</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-300">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="min-h-28 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
          placeholder="Description du produit..."
          rows={3}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="submit"
          name="saveAction"
          value="stay"
          disabled={loading || !form.name || !form.originalPrice || !form.category}
          variant="outline"
          className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.06] hover:text-white"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Sauvegarder et continuer
        </Button>
        <Button
          type="submit"
          name="saveAction"
          value="return"
          disabled={loading || !form.name || !form.originalPrice || !form.category}
          className="h-11 rounded-xl bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(124,58,237,0.28)] hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {isEditing ? 'Enregistrer et revenir' : 'Ajouter et revenir'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
