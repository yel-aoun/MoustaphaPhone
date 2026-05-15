import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { AVAILABLE_ICONS, ICON_COMPONENTS, suggestIcon } from '@/lib/categoryIcons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

function IconPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 rounded-xl border border-white/10 bg-[#0d1526] p-3 sm:grid-cols-8">
      {AVAILABLE_ICONS.map(({ name, label }) => {
        const Icon = ICON_COMPONENTS[name];
        const isSelected = value === name;
        return (
          <button
            key={name}
            type="button"
            title={label}
            onClick={() => onChange(name)}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-[9px] leading-none truncate w-full text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CategoryRow({ category, productCount, onEdit, onDelete, isDeleting }) {
  const Icon = ICON_COMPONENTS[category.icon] ?? ICON_COMPONENTS['Tag'];
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{category.name}</p>
          <p className="text-xs text-slate-500">
            {productCount} produit{productCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category.name)}
          disabled={isDeleting}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function EditRow({ category, onSave, onCancel, isSaving }) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [showPicker, setShowPicker] = useState(false);
  const Icon = ICON_COMPONENTS[icon] ?? ICON_COMPONENTS['Tag'];

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
  };

  return (
    <div className="px-5 py-4 space-y-3 bg-white/[0.03]">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((p) => !p)}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:border-primary/40 transition-colors"
          title="Changer l'icône"
        >
          <Icon className="w-4 h-4 text-primary" />
        </button>
        <Input
          value={name}
          onChange={handleNameChange}
          className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
          placeholder="Nom de la catégorie"
          autoFocus
        />
        <button
          type="button"
          onClick={() => onSave({ name, icon })}
          disabled={!name.trim() || isSaving}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {showPicker && (
        <IconPicker
          value={icon}
          onChange={(v) => {
            setIcon(v);
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

export default function AdminCategoryManager() {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('Tag');
  const [showNewPicker, setShowNewPicker] = useState(false);
  const [editingName, setEditingName] = useState(null);

  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const addMutation = useAddCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Auto-suggest icon as the user types
  const handleNewNameChange = (e) => {
    const val = e.target.value;
    setNewName(val);
    if (val.trim()) {
      const suggested = suggestIcon(val);
      setNewIcon(suggested);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    addMutation.mutate(
      { name: trimmed, icon: newIcon },
      {
        onSuccess: () => {
          toast.success(`Catégorie "${trimmed}" ajoutée`);
          setNewName('');
          setNewIcon('Tag');
          setShowNewPicker(false);
        },
        onError: (err) => toast.error(err.message || "Erreur lors de l'ajout"),
      }
    );
  };

  const handleUpdate = (oldName, { name, icon }) => {
    updateMutation.mutate(
      { oldName, name, icon },
      {
        onSuccess: () => {
          toast.success(`Catégorie mise à jour`);
          setEditingName(null);
        },
        onError: (err) => toast.error(err.message || 'Erreur lors de la modification'),
      }
    );
  };

  const handleDelete = (name) => {
    const inUse = products.filter((p) => p.category === name).length;
    if (inUse > 0) {
      toast.error(
        `Impossible de supprimer "${name}" — ${inUse} produit${inUse > 1 ? 's' : ''} l'utilisent`
      );
      return;
    }
    deleteMutation.mutate(name, {
      onSuccess: () => toast.success(`Catégorie "${name}" supprimée`),
    });
  };

  const NewIcon = ICON_COMPONENTS[newIcon] ?? ICON_COMPONENTS['Tag'];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-semibold text-white">Catégories</h2>
        <p className="mt-1 text-sm text-slate-400">
          Gérez les catégories. L'icône est suggérée automatiquement selon le nom.
        </p>
      </div>

      {/* Add category */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
        <p className="text-sm font-medium text-white">Nouvelle catégorie</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowNewPicker((p) => !p)}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:border-primary/40 transition-colors"
            title="Choisir une icône"
          >
            <NewIcon className="w-4 h-4 text-primary" />
          </button>
          <Input
            value={newName}
            onChange={handleNewNameChange}
            placeholder="Nom de la catégorie"
            className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-primary/40"
          />
          <Button
            type="submit"
            disabled={!newName.trim() || addMutation.isPending}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Plus className="w-4 h-4 mr-1" /> Ajouter</>
            )}
          </Button>
        </form>

        {showNewPicker && (
          <IconPicker
            value={newIcon}
            onChange={(v) => {
              setNewIcon(v);
              setShowNewPicker(false);
            }}
          />
        )}
      </div>

      {/* Category list */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] divide-y divide-white/[0.06] overflow-hidden">
        {categories.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">Aucune catégorie</p>
        ) : (
          categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            if (editingName === cat.name) {
              return (
                <EditRow
                  key={cat.name}
                  category={cat}
                  onSave={(data) => handleUpdate(cat.name, data)}
                  onCancel={() => setEditingName(null)}
                  isSaving={updateMutation.isPending}
                />
              );
            }
            return (
              <CategoryRow
                key={cat.name}
                category={cat}
                productCount={count}
                onEdit={(c) => setEditingName(c.name)}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
