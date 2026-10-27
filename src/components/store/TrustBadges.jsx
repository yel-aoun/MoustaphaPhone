import { PackageCheck, ShieldCheck, RefreshCcw, Headphones } from 'lucide-react';

const BADGES = [
  { icon: PackageCheck, label: 'Livraison rapide',       sub: 'Partout au Maroc en 2–5 jours' },
  { icon: ShieldCheck,  label: 'Paiement à la livraison', sub: 'Payez cash à la réception'     },
  { icon: RefreshCcw,   label: 'Retours faciles',         sub: 'Sous 7 jours, sans conditions' },
  { icon: Headphones,   label: 'Support 7j/7',            sub: 'Via WhatsApp, réponse rapide'  },
];

export default function TrustBadges() {
  return (
    <div className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-10">
        {BADGES.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-extrabold leading-tight text-foreground">{label}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
