import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BadgePercent,
  Activity,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  MousePointerClick,
  Package,
  Search,
  ShoppingBag,
  Tag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { cloudinaryImage } from '@/lib/images';
import { storeBrand } from '@/lib/brand';

const ORDER_STATUS = {
  pending: { label: 'En attente', className: 'bg-orange-500/12 text-orange-300 border-orange-500/20' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-500/12 text-blue-300 border-blue-500/20' },
  delivered: { label: 'Livrée', className: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20' },
  cancelled: { label: 'Annulée', className: 'bg-red-500/12 text-red-300 border-red-500/20' },
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-MA')} MAD`;
}

function MetricCard({ label, value, helper, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/12 text-primary border-primary/20',
    emerald: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20',
    orange: 'bg-orange-500/12 text-orange-300 border-orange-500/20',
    slate: 'bg-slate-500/12 text-slate-300 border-slate-500/20',
    pink: 'bg-pink-500/12 text-pink-300 border-pink-500/20',
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-sm shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-normal text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {helper && <p className="mt-3 text-sm text-slate-400">{helper}</p>}
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-sm shadow-black/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
  });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list(),
    refetchInterval: 30_000,
  });
  const { data: categories = [] } = useCategories();
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => base44.analytics.summary(30),
    refetchInterval: 60_000,
  });
  const { data: health, error: healthError } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      const data = await response.json().catch(() => null);
      if (!data) throw new Error('Health check failed');
      return data;
    },
    retry: false,
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => {
    const active = products.filter((p) => !p.status || p.status === 'active').length;
    const inactive = products.filter((p) => p.status === 'inactive').length;
    const outOfStock = products.filter((p) => p.status === 'out_of_stock').length;
    const withDiscount = products.filter((p) => p.original_price && p.original_price > p.price).length;
    const visiblePct = products.length ? Math.round((active / products.length) * 100) : 0;

    const openOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const revenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const openValue = openOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const byCategory = categories
      .map((cat) => ({
        name: cat.name,
        count: products.filter((p) => p.category === cat.name).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const recentOrders = orders.slice(0, 5);
    const attentionProducts = products
      .filter((p) => p.status === 'out_of_stock' || p.status === 'inactive' || !p.image_url)
      .slice(0, 5);

    return {
      active,
      inactive,
      outOfStock,
      withDiscount,
      visiblePct,
      revenue,
      openOrders: openOrders.length,
      openValue,
      byCategory,
      statusCounts,
      recentOrders,
      attentionProducts,
      totalProducts: products.length,
      totalOrders: orders.length,
    };
  }, [products, orders, categories]);

  const analyticsCounts = useMemo(
    () => Object.fromEntries((analytics?.totals || []).map((item) => [item.event_type, item.count])),
    [analytics]
  );

  if (productsLoading || ordersLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{storeBrand.name} Admin</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-white">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-400">Commandes, visibilité boutique et catalogue en un coup d'oeil.</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-400">
          Actualisation auto des commandes: <span className="font-semibold text-slate-200">30s</span>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          health?.ok
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
            : 'border-orange-500/20 bg-orange-500/10 text-orange-200'
        }`}
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-semibold">
            Santé production: {health?.ok ? 'OK' : healthError ? healthError.message : 'vérification en cours'}
          </p>
          {health?.checks?.database && (
            <p className="text-xs opacity-90">
              DB: {health.checks.database.connected ? 'connectée' : 'déconnectée'} ·
              {' '}Produits: {health.checks.database.products ?? '-'} ·
              {' '}Catégories: {health.checks.database.categories ?? '-'}
              {health.checks.missing?.length ? ` · Variables manquantes: ${health.checks.missing.join(', ')}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Chiffre livré"
          value={formatMoney(stats.revenue)}
          helper={`${stats.totalOrders} commande${stats.totalOrders !== 1 ? 's' : ''} au total`}
          icon={Wallet}
          tone="emerald"
        />
        <MetricCard
          label="Commandes ouvertes"
          value={stats.openOrders}
          helper={`${formatMoney(stats.openValue)} à confirmer ou livrer`}
          icon={ShoppingBag}
          tone="orange"
        />
        <MetricCard
          label="Produits actifs"
          value={`${stats.active}/${stats.totalProducts}`}
          helper={`${stats.visiblePct}% du catalogue visible`}
          icon={Eye}
          tone="primary"
        />
        <MetricCard
          label="Promotions"
          value={stats.withDiscount}
          helper={`${stats.outOfStock} produit${stats.outOfStock !== 1 ? 's' : ''} en rupture`}
          icon={BadgePercent}
          tone="pink"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Vues produits"
          value={analyticsCounts.product_view || 0}
          helper="30 derniers jours"
          icon={Activity}
          tone="primary"
        />
        <MetricCard
          label="Ajouts panier"
          value={analyticsCounts.add_to_cart || 0}
          helper={`${analyticsCounts.wishlist_add || 0} ajout(s) favoris`}
          icon={MousePointerClick}
          tone="emerald"
        />
        <MetricCard
          label="WhatsApp"
          value={analyticsCounts.whatsapp_checkout || 0}
          helper="Clics de commande"
          icon={MessageCircle}
          tone="orange"
        />
        <MetricCard
          label="Recherches"
          value={(analyticsCounts.search || 0) + (analyticsCounts.empty_search || 0)}
          helper={`${analyticsCounts.empty_search || 0} sans résultat`}
          icon={Search}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Commandes récentes">
          {stats.recentOrders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-10 text-center text-sm text-slate-500">
              Aucune commande pour le moment.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => {
                const cfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
                return (
                  <div key={order.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-white/8 bg-[#111a30]/70 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{order.customer_name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{order.customer_phone}</p>
                    </div>
                    <span className={`inline-flex h-7 items-center justify-center rounded-full border px-2.5 text-xs font-semibold ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <p className="col-span-2 text-sm font-bold text-white sm:col-span-1 sm:text-right">
                      {formatMoney(order.total)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Santé catalogue">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Actifs', value: stats.active, icon: Eye, color: 'text-emerald-300' },
              { label: 'Masqués', value: stats.inactive, icon: EyeOff, color: 'text-slate-300' },
              { label: 'Rupture', value: stats.outOfStock, icon: Package, color: 'text-orange-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-[#111a30]/70 p-3 text-center">
                <Icon className={`mx-auto h-4 w-4 ${color}`} />
                <p className="mt-2 text-xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {stats.attentionProducts.length === 0 ? (
              <p className="rounded-lg border border-white/8 bg-[#111a30]/70 p-4 text-sm text-slate-500">
                Aucun produit à surveiller.
              </p>
            ) : (
              stats.attentionProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-[#111a30]/70 p-3">
                  {product.image_url ? (
                    <img src={cloudinaryImage(product.image_url, { width: 120, height: 120, crop: 'fill' })} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/[0.06]">
                      <Package className="h-4 w-4 text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {!product.image_url ? 'Image manquante' : product.status === 'out_of_stock' ? 'Rupture de stock' : 'Produit masqué'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Répartition par catégorie">
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun produit catégorisé.</p>
          ) : (
            <div className="space-y-3">
              {stats.byCategory.map(({ name, count }) => {
                const pct = stats.totalProducts ? Math.round((count / stats.totalProducts) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-slate-300">
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{name}</span>
                      </span>
                      <span className="font-mono text-xs text-slate-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06]">
                      <div className="h-2 rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Pipeline commandes">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ORDER_STATUS).map(([status, cfg]) => (
              <div key={status} className={`rounded-lg border p-4 ${cfg.className}`}>
                <p className="text-2xl font-extrabold text-white">{stats.statusCounts[status] || 0}</p>
                <p className="mt-1 text-sm font-semibold">{cfg.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#111a30]/70 p-3 text-sm text-slate-400">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            Les commandes ouvertes représentent {formatMoney(stats.openValue)}.
          </div>
        </Panel>
      </div>

      <Panel title="Engagement boutique">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Produits les plus consultés</p>
            {(analytics?.topProducts || []).length === 0 ? (
              <p className="rounded-lg border border-white/8 bg-[#111a30]/70 p-4 text-sm text-slate-500">
                Pas encore assez de données.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.topProducts.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-[#111a30]/70 p-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">{item.product_name}</p>
                    <span className="font-mono text-xs text-slate-400">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recherches fréquentes</p>
            {(analytics?.topSearches || []).length === 0 ? (
              <p className="rounded-lg border border-white/8 bg-[#111a30]/70 p-4 text-sm text-slate-500">
                Aucune recherche enregistrée.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.topSearches.map((item) => (
                  <div key={item.search_query} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-[#111a30]/70 p-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">{item.search_query}</p>
                    <span className="font-mono text-xs text-slate-400">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
