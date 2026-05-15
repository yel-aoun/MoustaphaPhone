import { PackageCheck, ShieldCheck, RefreshCcw, Headphones } from 'lucide-react';

const BADGES = [
  { icon: PackageCheck, label: 'Livraison rapide',       sub: 'Partout au Maroc en 2–5 jours' },
  { icon: ShieldCheck,  label: 'Paiement à la livraison', sub: 'Payez cash à la réception'     },
  { icon: RefreshCcw,   label: 'Retours faciles',         sub: 'Sous 7 jours, sans conditions' },
  { icon: Headphones,   label: 'Support 7j/7',            sub: 'Via WhatsApp, réponse rapide'  },
];

// Border classes per item for 2-col mobile → 4-col desktop grid
const BORDERS = [
  'border-r border-b border-border/50 lg:border-b-0',   // 0 — top-left
  'border-b border-border/50 lg:border-b-0 lg:border-r', // 1 — top-right (mobile) / 2nd col
  'border-r border-border/50 lg:border-r-0',             // 2 — bottom-left (mobile) / 3rd col
  '',                                                     // 3 — last: no border
];

export default function TrustBadges() {
  return (
    <div className="border-y border-border/60 bg-secondary/25 py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:px-10">
        {BADGES.map(({ icon: Icon, label, sub }, i) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-3 px-4 py-4 text-center sm:px-6 ${BORDERS[i]}`}
          >
            <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-extrabold leading-tight tracking-wider text-foreground uppercase">
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
