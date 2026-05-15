import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, MessageCircle, PackageCheck, Search, ShoppingBag, Truck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import BrandLogo from '@/components/brand/BrandLogo';
import { getProductUrl, toPublicUrl } from '@/lib/products';
import { cloudinaryImage } from '@/lib/images';
import { buildWhatsAppLink, storeBrand } from '@/lib/brand';

const STATUS = {
  pending: { label: 'En attente', icon: Clock3, className: 'text-orange-500 bg-orange-500/10' },
  confirmed: { label: 'Confirmée', icon: PackageCheck, className: 'text-blue-500 bg-blue-500/10' },
  delivered: { label: 'Livrée', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10' },
  cancelled: { label: 'Annulée', icon: XCircle, className: 'text-red-500 bg-red-500/10' },
};

const TRACK_STEPS = [
  { key: 'pending', label: 'Commande reçue', detail: 'Nous vérifions la disponibilité.' },
  { key: 'confirmed', label: 'Confirmée', detail: 'Préparation ou confirmation client.' },
  { key: 'delivered', label: 'Livrée', detail: 'Commande terminée.' },
];

function getSupportUrl(order) {
  const code = String(order?.id || '').slice(0, 8);
  const message = `Bonjour ${storeBrand.name}, j'ai une question sur ma commande${code ? ` #${code}` : ''}.`;
  return buildWhatsAppLink(message);
}

function getOrderItemUrl(item) {
  return toPublicUrl(item?.product_url || getProductUrl(item));
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const searchOrders = async (nextPhone = phone, nextOrderId = orderId) => {
    if (nextPhone.replace(/\D/g, '').length < 9) {
      setError('Entrez le numéro utilisé pour la commande.');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const result = await base44.entities.Order.track({ phone: nextPhone, id: nextOrderId });
      setOrders(result);
    } catch (err) {
      setError(err.message || 'Impossible de rechercher la commande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextPhone = searchParams.get('phone') || '';
    const nextOrderId = searchParams.get('id') || '';
    if (!nextPhone) return;
    setPhone(nextPhone);
    setOrderId(nextOrderId);
    searchOrders(nextPhone, nextOrderId);
    // Run once on page load so shared tracking links auto-search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    searchOrders();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <BrandLogo size="sm" />
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Boutique
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-normal text-foreground">Suivre une commande</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Entrez votre téléphone. Le code commande est optionnel si vous ne l'avez pas.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
            >
              <ShoppingBag className="h-4 w-4" />
              Retour à la boutique
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_0.8fr_auto]">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" type="tel" />
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Code commande optionnel" />
            <Button type="submit" disabled={loading} className="h-10 rounded-lg">
              <Search className="mr-2 h-4 w-4" />
              Rechercher
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </section>

        <section className="mt-6 space-y-3">
          {loading && (
            <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground shadow-sm">
              Recherche de votre commande...
            </div>
          )}

          {orders.map((order) => {
            const cfg = STATUS[order.status] || STATUS.pending;
            const Icon = cfg.icon;
            const activeIndex = Math.max(0, TRACK_STEPS.findIndex((step) => step.key === order.status));
            const isCancelled = order.status === 'cancelled';
            return (
              <article key={order.id} className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{String(order.id).slice(0, 8)}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{order.customer_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('fr-MA')}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${cfg.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </div>

                {isCancelled ? (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                    Cette commande est annulée. Contactez {storeBrand.name} si vous souhaitez la réactiver ou commander un autre produit.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2 rounded-lg border border-border bg-secondary/25 p-3 sm:grid-cols-3">
                    {TRACK_STEPS.map((step, index) => {
                      const done = index <= activeIndex;
                      return (
                        <div key={step.key} className="flex gap-2">
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-foreground">{step.label}</span>
                            <span className="block text-xs leading-5 text-muted-foreground">{step.detail}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 divide-y divide-border rounded-lg border border-border">
                  {(order.items || []).map((item, index) => {
                    const itemUrl = getOrderItemUrl(item);
                    const imageUrl = item.image_url
                      ? cloudinaryImage(item.image_url, { width: 144, height: 144, crop: 'fill', transform: true })
                      : '';
                    return (
                      <div key={`${item.id || item.name}-${index}`} className="flex flex-col gap-3 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="h-16 w-16 shrink-0 rounded-lg border border-border bg-secondary object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                          <span className="min-w-0">
                            <span className="line-clamp-2 font-medium text-foreground">{item.name} x{item.quantity}</span>
                            {item.selectedColor && (
                              <span className="mt-1 block text-xs text-muted-foreground">Couleur: {item.selectedColor}</span>
                            )}
                            <span className="mt-1 block font-mono text-xs font-semibold text-muted-foreground">
                              {Number(item.price * item.quantity || 0).toLocaleString('fr-MA')} DH
                            </span>
                          </span>
                        </div>
                        <a
                          href={itemUrl}
                          className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary sm:w-auto"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Voir le produit
                        </a>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-mono text-lg font-extrabold text-primary">
                    {Number(order.total || 0).toLocaleString('fr-MA')} DH
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    to="/"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Continuer mes achats
                  </Link>
                  <a
                    href={getSupportUrl(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-green-500/40 hover:text-green-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter {storeBrand.name}
                  </a>
                </div>
              </article>
            );
          })}

          {searched && !loading && orders.length === 0 && !error && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-8 text-center">
              <p className="font-semibold text-foreground">Aucune commande trouvée</p>
              <p className="mt-1 text-sm text-muted-foreground">Vérifiez le numéro ou contactez {storeBrand.name} sur WhatsApp.</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Retour à la boutique
                </Link>
                <a
                  href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, je n'arrive pas à retrouver ma commande.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-green-500/40 hover:text-green-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  Aide WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
