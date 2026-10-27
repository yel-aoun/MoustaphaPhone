import { PackageCheck, ShieldCheck, RefreshCcw, Headphones } from 'lucide-react';

const BADGES = [
  { icon: PackageCheck, label: 'Livraison rapide',       sub: 'Partout au Maroc en 2–5 jours' },
  { icon: ShieldCheck,  label: 'Paiement à la livraison', sub: 'Payez cash à la réception'     },
  { icon: RefreshCcw,   label: 'Retours faciles',         sub: 'Sous 7 jours, sans conditions' },
  { icon: Headphones,   label: 'Support 7j/7',            sub: 'Via WhatsApp, réponse rapide'  },
];

export default function TrustBadges() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BADGES.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="group flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/30"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-foreground">{label}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
