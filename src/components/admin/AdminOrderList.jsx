import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Package, Phone, User, Clock, ChevronDown, ChevronUp, Trash2, RefreshCw, Eye, MessageCircle, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { storeBrand } from '@/lib/brand';

const STATUS_CONFIG = {
  pending:   { label: 'En attente',  color: 'bg-orange-500/15 text-orange-500 border-orange-500/20' },
  confirmed: { label: 'Confirmée',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  delivered: { label: 'Livrée',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Annulée',     color: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

const STATUS_FLOW = ['pending', 'confirmed', 'delivered', 'cancelled'];

function buildOrderWhatsAppLink(order, messageOverride = null) {
  const digits = String(order.customer_phone || '').replace(/\D/g, '');
  const phone = digits.startsWith('0') ? `212${digits.slice(1)}` : digits;
  const message = messageOverride || `Bonjour ${order.customer_name || ''}, votre commande ${storeBrand.name} est en cours de suivi.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function OrderRow({ order, onStatusChange, onDelete, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const date = new Date(order.created_at).toLocaleDateString('fr-MA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-white truncate">{order.customer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a
              href={`tel:${order.customer_phone}`}
              className="text-xs text-slate-400 hover:text-primary transition-colors"
            >
              {order.customer_phone}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-sm font-bold text-white">
            {Number(order.total).toLocaleString('fr-MA')} DH
          </span>

          {/* Status selector */}
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-transparent outline-none ${cfg.color}`}
          >
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s} className="bg-[#111a30] text-white">
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onOpen(order)}
            className="h-7 rounded-2xl border border-white/10 px-2 text-xs font-semibold text-slate-400 transition-colors hover:border-primary/30 hover:text-primary"
          >
            Détails
          </button>

          <button
            onClick={() => onDelete(order.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="Supprimer la commande"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
            aria-label={expanded ? 'Réduire' : 'Afficher les produits'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Produits commandés</p>
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-300">
              <span className="line-clamp-1 flex-1">{item.name}</span>
              <span className="shrink-0 ml-4 text-slate-400">
                ×{item.quantity} — {(item.price * item.quantity).toLocaleString('fr-MA')} DH
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            {date}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrderList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list(),
    refetchInterval: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Commande supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const filtered = orders.filter((order) => {
    const matchesStatus = filter === 'all' || order.status === filter;
    const created = new Date(order.created_at);
    const today = new Date();
    const isToday = created.toDateString() === today.toDateString();
    const matchesQuick =
      quickFilter === 'all' ||
      (quickFilter === 'today' && isToday) ||
      (quickFilter === 'needs_confirmation' && order.status === 'pending') ||
      (quickFilter === 'ready_to_deliver' && order.status === 'confirmed');
    return matchesStatus && matchesQuick;
  });
  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId) || null
    : null;

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Commandes</h2>
          <p className="text-sm text-slate-400 mt-0.5">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-white/10 text-xs text-slate-300 hover:border-white/20 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_FLOW.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                filter === s ? cfg.color : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <p className="text-2xl font-bold text-white">{counts[s] || 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'Toutes'],
          ['today', "Aujourd'hui"],
          ['needs_confirmation', 'À confirmer'],
          ['ready_to_deliver', 'Prêtes livraison'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setQuickFilter(value)}
            className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              quickFilter === value
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Package className="w-14 h-14 mb-3 opacity-20" />
          <p className="font-medium text-slate-400">Aucune commande</p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="mt-2 text-xs text-primary hover:underline">
              Voir toutes les commandes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onOpen={(nextOrder) => setSelectedOrderId(nextOrder.id)}
            />
          ))}
        </div>
      )}

      <Sheet open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto border-white/10 bg-[#0d1017] p-0 text-slate-100 sm:max-w-lg">
          {selectedOrder && (
            <>
              <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-4 w-4 text-primary" />
                  Détail commande
                </SheetTitle>
                <SheetDescription className="text-slate-500">
                  #{String(selectedOrder.id).slice(0, 8)} · {new Date(selectedOrder.created_at).toLocaleString('fr-MA')}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-5 py-5">
                <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Client</p>
                      <h3 className="mt-1 truncate text-lg font-bold text-white">{selectedOrder.customer_name}</h3>
                      <a href={`tel:${selectedOrder.customer_phone}`} className="mt-1 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-primary">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                    <a
                      href={buildOrderWhatsAppLink(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-500 px-3 text-sm font-semibold text-white hover:bg-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Statut</p>
                      <p className="mt-1 text-sm text-slate-400">Mettez à jour l'étape de traitement.</p>
                    </div>
                    <select
                      value={selectedOrder.status}
                      onChange={(event) => updateMutation.mutate({ id: selectedOrder.id, status: event.target.value })}
                      className={`rounded-full border bg-transparent px-3 py-1.5 text-xs font-semibold outline-none ${STATUS_CONFIG[selectedOrder.status]?.color || STATUS_CONFIG.pending.color}`}
                    >
                      {STATUS_FLOW.map((status) => (
                        <option key={status} value={status} className="bg-[#111a30] text-white">
                          {STATUS_CONFIG[status].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_FLOW.map((status) => {
                      const active = selectedOrder.status === status;
                      return (
                        <div key={status} className={`rounded-lg border px-2 py-2 text-center text-[10px] font-semibold ${
                          active ? STATUS_CONFIG[status].color : 'border-white/10 bg-white/[0.02] text-slate-500'
                        }`}>
                          {STATUS_CONFIG[status].label}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Produits</p>
                    <p className="font-mono text-lg font-extrabold text-white">
                      {Number(selectedOrder.total || 0).toLocaleString('fr-MA')} DH
                    </p>
                  </div>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div key={`${item.id || item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-white">{item.name}</p>
                          {item.selectedColor && <p className="mt-0.5 text-xs text-slate-500">Couleur: {item.selectedColor}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-slate-500">x{item.quantity}</p>
                          <p className="font-mono text-sm font-bold text-slate-200">
                            {Number(item.price * item.quantity || 0).toLocaleString('fr-MA')} DH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {selectedOrder.note && (
                  <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <FileText className="h-3.5 w-3.5" />
                      Note
                    </p>
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-300">{selectedOrder.note}</p>
                  </section>
                )}

                <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Messages rapides</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      ['Confirmation', `Bonjour ${selectedOrder.customer_name || ''}, votre commande ${storeBrand.name} est confirmée. Nous préparons la livraison.`],
                      ['Livraison', `Bonjour ${selectedOrder.customer_name || ''}, votre commande ${storeBrand.name} est prête pour la livraison. Merci de rester joignable.`],
                    ].map(([label, message]) => (
                      <a
                        key={label}
                        href={buildOrderWhatsAppLink(selectedOrder, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-green-500/30 hover:text-green-300"
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
