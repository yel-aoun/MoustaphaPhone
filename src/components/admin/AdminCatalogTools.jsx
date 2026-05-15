import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, Loader2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import {
  csvRowToProduct,
  downloadTextFile,
  parseCsv,
  productsToCsv,
  productsToMarketplaceCsv,
} from '@/lib/csv';
import { storeBrand } from '@/lib/brand';

export default function AdminCatalogTools({ products = [] }) {
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);

  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleExport = () => {
    downloadTextFile(`${storeBrand.slug}-products-${new Date().toISOString().slice(0, 10)}.csv`, productsToCsv(products));
  };

  const handleMarketplaceExport = () => {
    downloadTextFile(
      `${storeBrand.slug}-marketplace-${new Date().toISOString().slice(0, 10)}.csv`,
      productsToMarketplaceCsv(products)
    );
  };

  const buildPreview = (rows) => {
    const existingIds = new Set(products.map((product) => product.id));
    const parsed = rows.map((row, index) => {
      const product = csvRowToProduct(row);
      const errors = [];
      if (!product.name) errors.push('nom manquant');
      if (!product.price) errors.push('prix manquant');
      if (!product.category) errors.push('catégorie manquante');
      const action = product.id && existingIds.has(product.id) ? 'update' : 'create';
      return { index: index + 2, product, action, errors };
    });

    return {
      rows: parsed,
      create: parsed.filter((row) => row.action === 'create' && row.errors.length === 0).length,
      update: parsed.filter((row) => row.action === 'update' && row.errors.length === 0).length,
      errors: parsed.filter((row) => row.errors.length > 0),
    };
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      setPreview(buildPreview(rows));
    } catch (error) {
      toast.error(error.message || 'Lecture CSV impossible');
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const row of preview.rows) {
        if (row.errors.length > 0) {
          skipped += 1;
          continue;
        }

        const { id, ...payload } = row.product;
        if (row.action === 'update' && id) {
          await base44.entities.Product.update(id, payload);
          updated += 1;
        } else {
          await base44.entities.Product.create(payload);
          created += 1;
        }
      }

      refreshProducts();
      setPreview(null);
      toast.success(`Import terminé: ${created} ajouté(s), ${updated} mis à jour, ${skipped} ignoré(s).`);
    } catch (error) {
      toast.error(error.message || 'Import CSV impossible');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">Outils catalogue</h3>
          <p className="mt-1 text-xs text-slate-500">
            Export CSV, import de mise à jour, et fichier prêt pour marketplace.
          </p>
        </div>

        {preview && (
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-slate-200">
                <p className="font-semibold">Aperçu import CSV</p>
                <p className="mt-1 text-xs text-slate-400">
                  {preview.create} création(s), {preview.update} mise(s) à jour, {preview.errors.length} ligne(s) avec erreur.
                </p>
                {preview.errors.length > 0 && (
                  <p className="mt-1 text-xs text-orange-300">
                    Première erreur ligne {preview.errors[0].index}: {preview.errors[0].errors.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="h-9 rounded-lg border border-white/10 bg-[#111a30] px-3 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importing}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-70"
                >
                  {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111a30] px-3 text-sm font-semibold text-slate-200 transition-colors hover:border-primary/40 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleMarketplaceExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#111a30] px-3 text-sm font-semibold text-slate-200 transition-colors hover:border-primary/40 hover:text-white"
          >
            <Megaphone className="h-4 w-4" />
            Marketplace
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={importing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Import CSV
          </button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelected} />
        </div>
      </div>
    </div>
  );
}
