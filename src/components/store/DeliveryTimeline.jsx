import { Home, PackageCheck, ShoppingBag } from 'lucide-react';

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('fr-MA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DeliveryTimeline() {
  const steps = [
    { icon: ShoppingBag, label: 'Commande', date: "Aujourd'hui" },
    { icon: PackageCheck, label: 'Expédition', date: addDays(1) },
    { icon: Home, label: 'Livraison', date: `${addDays(1)} – ${addDays(3)}` },
  ];

  return (
    <div className="rounded-3xl bg-secondary p-5">
      <p className="text-sm font-semibold text-foreground">Livraison estimée</p>
      <div className="relative mt-4">
<div className="absolute left-[16%] right-[16%] top-4 h-0.5 rounded-full overflow-hidden bg-border" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 w-1/4 animate-slide-x bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
        <ol className="relative grid grid-cols-3 text-center">
          {steps.map(({ icon: Icon, label, date }, i) => (
            <li key={label} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${i === 0 ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-foreground">{label}</span>
              <span className="text-[11px] capitalize text-muted-foreground">{date}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Paiement en cash à la réception · Retour accepté sous 7 jours
      </p>
    </div>
  );
}
