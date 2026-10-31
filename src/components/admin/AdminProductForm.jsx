import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, X, Upload, ImagePlus, Flame, Palette, ListChecks, ArrowLeft, ArrowRight, AlertTriangle, Tag, RotateCcw } from 'lucide-react';
import { suggestColorName } from '@/lib/colorNames';
import { base44, compressImageToDataUrl } from '@/api/base44Client';
import { storagePrefix } from '@/lib/brand';
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

const DRAFT_KEY = `${storagePrefix}_product_draft`;

let imageSeq = 0;
const nextImageId = () => `img-${Date.now()}-${imageSeq++}`;

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
    .map((url) => ({ id: nextImageId(), preview: url, url, status: 'ready' })),
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

// Drafts survive a reload (iOS can reload a tab it evicted, or on an accidental pull-to-refresh).
// New products and each edited product keep their own draft. Only uploaded photos can be kept,
// so colour links are remapped to the photos that remain.
const draftKeyFor = (product) => (product?.id ? `${DRAFT_KEY}:${product.id}` : DRAFT_KEY);

function formToDraft(form) {
  const kept = [];
  const indexMap = new Map();
  form.images.forEach((img, idx) => {
    if (!img.url) return;
    indexMap.set(idx, kept.length);
    kept.push({ id: img.id, preview: img.url, url: img.url, status: 'ready' });
  });
  const hasContent = form.name || form.description || form.originalPrice || kept.length > 0 || form.specs.length > 0;
  if (!hasContent) return null;
  return {
    ...form,
    images: kept,
    colors: form.colors.map((c) => ({
      ...c,
      imageIndices: (c.imageIndices || []).filter((i) => indexMap.has(i)).map((i) => indexMap.get(i)),
    })),
  };
}

// Compares drafts by content, ignoring the per-session photo ids
const draftSignature = (draft) =>
  draft && JSON.stringify({ ...draft, images: draft.images.map((img) => img.url) });

function loadDraft(key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || 'null');
    return draft && Array.isArray(draft.images) ? { ...createEmptyForm(), ...draft } : null;
  } catch {
    return null;
  }
}

function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode); nothing to clear
  }
}

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
  const draftKey = draftKeyFor(product);
  const baseForm = () => (product ? productToForm(product) : createEmptyForm());
  const [form, setForm] = useState(() => loadDraft(draftKey) || baseForm());
  const [draftRestored, setDraftRestored] = useState(() => Boolean(loadDraft(draftKey)));
  // Per photo: the shrink-and-upload promise and the shrunk data URL (kept for a retry on save)
  const uploadsRef = useRef(new Map());
  const dataUrlsRef = useRef(new Map());
  const isEditing = Boolean(product?.id);

  useEffect(() => {
    const draft = loadDraft(draftKeyFor(product));
    setForm(draft || (product ? productToForm(product) : createEmptyForm()));
    setDraftRestored(Boolean(draft));
  }, [product]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = formToDraft(form);
        // An edit only needs a draft once it differs from the saved product
        const unchanged = isEditing && draftSignature(draft) === draftSignature(formToDraft(productToForm(product)));
        if (draft && !unchanged) localStorage.setItem(draftKey, JSON.stringify(draft));
        else localStorage.removeItem(draftKey);
      } catch {
        // Storage full or unavailable; the draft is a convenience only
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form, draftKey, isEditing, product]);

  const discardDraft = () => {
    clearDraft(draftKey);
    setForm(baseForm());
    setDraftRestored(false);
  };

  // Derived values
  const originalPrice = parseFloat(form.originalPrice) || 0;
  const salePrice = parseFloat(form.salePrice) || 0;
  const hasDiscount = form.salePrice !== '' && salePrice > 0 && originalPrice > salePrice;
  const discountPct = hasDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

  const updateImage = (id, patch) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    }));
  };

  const uploadDataUrl = async (id, dataUrl) => {
    updateImage(id, { status: 'uploading' });
    const { file_url } = await base44.integrations.Core.UploadFile({ dataUrl });
    updateImage(id, { url: file_url, status: 'ready' });
    return file_url;
  };

  // Phone photos are shrunk one at a time as soon as they are picked, then uploaded in the
  // background. Holding several full-size 12MP previews is what made iOS Safari reload the tab.
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const pending = files.map((file) => ({ file, id: nextImageId() }));
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...pending.map(({ id }) => ({ id, preview: null, url: null, status: 'processing' }))],
    }));

    for (const { file, id } of pending) {
      let dataUrl;
      try {
        dataUrl = await compressImageToDataUrl(file);
      } catch {
        updateImage(id, { status: 'error' });
        uploadsRef.current.set(id, Promise.reject(new Error(`Image illisible : ${file.name}`)));
        uploadsRef.current.get(id).catch(() => {});
        continue;
      }
      dataUrlsRef.current.set(id, dataUrl);
      updateImage(id, { preview: dataUrl, status: 'uploading' });
      const upload = uploadDataUrl(id, dataUrl).catch((error) => {
        updateImage(id, { status: 'error' });
        throw error;
      });
      upload.catch(() => {});
      uploadsRef.current.set(id, upload);
    }
  };

  // Waits for a photo's background upload, retrying once from the shrunk copy if it failed
  const resolveImageUrl = async (img) => {
    if (img.url) return img.url;
    try {
      const url = await uploadsRef.current.get(img.id);
      if (url) return url;
    } catch {
      // Fall through to a retry
    }
    const dataUrl = dataUrlsRef.current.get(img.id);
    if (!dataUrl) throw new Error("Une image n'a pas pu être préparée. Retirez-la et réessayez.");
    return uploadDataUrl(img.id, dataUrl);
  };

  const imagesBusy = form.images.some((img) => img.status === 'processing' || img.status === 'uploading');

  // Colour swatches link photos by position, so their links follow the photos when the order changes
  const remapColorImages = (colors, mapIndex) =>
    colors.map((c) => ({
      ...c,
      imageIndices: (c.imageIndices || [])
        .map(mapIndex)
        .filter((i) => i !== null)
        .sort((a, b) => a - b),
    }));

  const removeImage = (idx) => {
    const removed = form.images[idx];
    if (removed) {
      uploadsRef.current.delete(removed.id);
      dataUrlsRef.current.delete(removed.id);
    }
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
      colors: remapColorImages(prev.colors, (i) => (i === idx ? null : i > idx ? i - 1 : i)),
    }));
  };

  const moveImage = (idx, direction) => {
    setForm((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      const images = [...prev.images];
      [images[idx], images[target]] = [images[target], images[idx]];
      return {
        ...prev,
        images,
        colors: remapColorImages(prev.colors, (i) => (i === idx ? target : i === target ? idx : i)),
      };
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
    if (loading) return;
    const submitAction = e.nativeEvent?.submitter?.value || 'return';
    setLoading(true);

    try {
      const resolvedUrls = [];
      for (const img of form.images) {
        resolvedUrls.push(await resolveImageUrl(img));
      }

      const [mainImage, ...extraImages] = resolvedUrls;

      // A swatch without a name gets one from its shade instead of being dropped
      const validColors = form.colors
        .filter((c) => c.hex)
        .map((c) => ({ ...c, name: c.name.trim() || suggestColorName(c.hex) }));
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
      } else {
        savedProduct = await base44.entities.Product.create(payload);
      }

      queryClient.setQueryData(['admin-products'], (current = []) => upsertProductInCache(current, savedProduct));
      queryClient.setQueryData(['products'], (current = []) => upsertProductInCache(current, savedProduct));
      // The write has completed and both caches contain the saved product.
      // A slow catalogue refresh must never block returning to the list.
      void Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
      toast.success(isEditing ? 'Produit mis à jour avec succès' : 'Produit ajouté avec succès');
      clearDraft(draftKey);
      setDraftRestored(false);
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
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/12 bg-white/[0.05] p-4 shadow-[0_20px_70px_rgba(2,6,23,0.45)] sm:p-7 md:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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
            onClick={() => {
              clearDraft(draftKey);
              onCancel();
            }}
            className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Annuler
          </button>
        ) : null}
      </div>

      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-slate-200">
          <span>Brouillon restauré — vous pouvez reprendre où vous en étiez.</span>
          <button
            type="button"
            onClick={discardDraft}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recommencer
          </button>
        </div>
      )}

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
              <div key={img.id} className="relative group">
                <div
                  className={`relative aspect-square overflow-hidden rounded-xl border ${
                    img.status === 'error' ? 'border-red-500/70' : idx === 0 ? 'border-primary/70' : 'border-white/10'
                  } bg-[#131c31]`}
                >
                  {img.preview ? (
                    <img
                      src={img.preview}
                      alt=""
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-slate-500" />
                    </div>
                  )}
                  {(img.status === 'processing' || img.status === 'uploading') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#0d1017]/70 text-[10px] font-medium text-slate-200">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      {img.status === 'processing' ? 'Préparation…' : 'Envoi…'}
                    </div>
                  )}
                  {img.status === 'error' && (
                    <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-1 bg-red-500/90 px-1 py-0.5 text-[9px] font-semibold text-white">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Réessai à l'envoi
                    </div>
                  )}
                </div>
                {idx === 0 && (
                  <span className="absolute -top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Main
                  </span>
                )}
                <div className="absolute bottom-1 left-1 flex gap-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d1017]/90 text-white disabled:opacity-30"
                    aria-label="Déplacer l'image vers la gauche"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === form.images.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d1017]/90 text-white disabled:opacity-30"
                    aria-label="Déplacer l'image vers la droite"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-white transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                  aria-label="Retirer l'image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-sm font-medium text-slate-300 transition-colors hover:border-primary/40 hover:text-white">
            <Upload className="h-4 w-4" />
            Importer des fichiers
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Specs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-slate-400" />
            Fiche technique
            <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <button
            type="button"
            onClick={addSpec}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-primary/40 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
        {form.specs.length > 0 ? (
          <div className="space-y-2">
            {form.specs.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
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
                  aria-label="Retirer la ligne"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            Couleurs disponibles
            <span className="text-xs text-slate-500">(optionnel)</span>
          </Label>
          <button
            type="button"
            onClick={addColor}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-primary/40 hover:text-white transition-colors"
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
                    placeholder={`${suggestColorName(color.hex)} (nom automatique)`}
                    className="min-w-0 flex-1 h-9 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 text-sm"
                  />
                  {/* Hex display */}
                  <span className="font-mono text-xs text-slate-500 hidden sm:block w-16 text-right">{color.hex}</span>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    aria-label="Retirer la couleur"
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-destructive/20 text-slate-500 hover:text-red-400 transition-colors"
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
              inputMode="decimal"
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
              inputMode="decimal"
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
          Enregistrer et rester ici
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {imagesBusy ? 'Envoi des images...' : 'Enregistrement...'}
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
