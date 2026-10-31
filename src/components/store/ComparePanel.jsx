import { categoryLabel } from '@/lib/productCategories';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Circle, Package, Scale, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCompare } from '@/lib/compareStore';
import { cloudinaryImage } from '@/lib/images';
import { formatMoney } from '@/lib/products';

const ROWS = [
  ['Prix', (product) => formatMoney(product.price)],
  ['Catégorie', (product) => product.category || '-'],
  ['Stock', (product) => (product.status === 'out_of_stock' ? 'Rupture' : 'En stock')],
  ['Couleurs', (product) => (product.colors?.length ? product.colors.map((color) => color.name).join(', ') : '-')],
];

export default function ComparePanel({ products = [] }) {
  const { compareIds, clearCompare, removeCompare, maxCompare } = useCompare();
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => compareIds.map((id) => products.find((product) => product.id === id)).filter(Boolean),
    [compareIds, products]
  );
  const specNames = useMemo(
    () => Array.from(new Set(selected.flatMap((product) => product.specs?.map((spec) => spec.name) || []))),
    [selected]
  );

  useEffect(() => {
    if (selected.length === 0 && open) setOpen(false);
  }, [open, selected.length]);

  if (selected.length === 0) return null;

  const handleClear = () => {
    setOpen(false);
    clearCompare();
  };

  return (
    <>
      <div className="fixed bottom-40 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg border border-border bg-background/95 p-2.5 shadow-xl backdrop-blur sm:bottom-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Comparaison</p>
              <p className="text-xs text-muted-foreground">
                {selected.length}/{maxCompare} produit{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[240px]">
            {selected.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => removeCompare(product.id)}
                className="group relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-white"
                aria-label={`Retirer ${product.name} de la comparaison`}
              >
                {product.image_url ? (
                  <img src={cloudinaryImage(product.image_url, { width: 96, height: 96, crop: 'pad' })} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Package className="m-auto mt-2.5 h-4 w-4 text-muted-foreground" />
                )}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/55 text-white group-hover:flex">
                  <X className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setOpen(true)} className="h-9 flex-1 rounded-lg sm:flex-none">
              <BarChart3 className="mr-2 h-4 w-4" />
              Comparer
            </Button>
            <button
              type="button"
              onClick={handleClear}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
              aria-label="Vider la comparaison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] overflow-hidden rounded-t-2xl border-border bg-background p-0 sm:bottom-4 sm:left-1/2 sm:right-auto sm:h-[86vh] sm:w-[min(1120px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-2xl sm:border"
        >
          <SheetHeader className="border-b border-border bg-secondary/20 px-4 py-4 pr-12 text-left sm:px-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-xl font-extrabold tracking-normal">Comparer les produits</SheetTitle>
                <SheetDescription>
                  Prix, stock, couleurs et fiche technique dans une seule vue.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="h-[calc(92vh-82px)] overflow-y-auto p-4 sm:h-[calc(86vh-82px)] sm:p-6">
            <div className="grid gap-3 md:grid-cols-3">
              {selected.map((product) => (
                <article key={product.id} className="relative overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                  <button
                    type="button"
                    onClick={() => removeCompare(product.id)}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/90 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
                    aria-label="Retirer de la comparaison"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="bg-white px-4 pt-4">
                    {product.image_url ? (
                      <img
                        src={cloudinaryImage(product.image_url, { width: 420, height: 300, crop: 'pad' })}
                        alt={product.name}
                        className="h-36 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {categoryLabel(product.category) || 'Produit'}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          product.status === 'out_of_stock'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        <Circle className="h-1.5 w-1.5 fill-current" />
                        {product.status === 'out_of_stock' ? 'Rupture' : 'En stock'}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-foreground">{product.name}</h3>
                    <p className="font-mono text-xl font-extrabold text-primary">{formatMoney(product.price)}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <div className="flex flex-col gap-1 border-b border-border bg-secondary/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Tableau comparatif</h3>
                  <p className="text-xs text-muted-foreground">Les différences restent faciles à scanner sur mobile et desktop.</p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:mt-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vider
                </button>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <tbody className="divide-y divide-border">
                  {ROWS.map(([label, getter]) => (
                    <tr key={label}>
                      <th className="sticky left-0 z-10 w-36 bg-background px-4 py-3 text-left font-bold text-foreground shadow-[1px_0_0_hsl(var(--border))]">
                        {label}
                      </th>
                      {selected.map((product) => (
                        <td key={product.id} className="min-w-44 px-4 py-3 font-medium text-muted-foreground">
                          {getter(product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {specNames.length > 0 && (
                    <tr>
                      <th className="sticky left-0 z-10 bg-secondary px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground shadow-[1px_0_0_hsl(var(--border))]">
                        Fiche technique
                      </th>
                      {selected.map((product) => (
                        <td key={product.id} className="bg-secondary px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {product.specs?.length || 0} spec{product.specs?.length > 1 ? 's' : ''}
                        </td>
                      ))}
                    </tr>
                  )}
                  {specNames.map((specName) => (
                    <tr key={specName}>
                      <th className="sticky left-0 z-10 w-36 bg-background px-4 py-3 text-left font-bold text-foreground shadow-[1px_0_0_hsl(var(--border))]">
                        {specName}
                      </th>
                      {selected.map((product) => (
                        <td key={product.id} className="min-w-44 px-4 py-3 font-medium text-muted-foreground">
                          {product.specs?.find((spec) => spec.name === specName)?.value || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
