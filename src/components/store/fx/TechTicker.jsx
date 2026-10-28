import { BatteryCharging, Cpu, ShieldCheck, Truck, Wallet, Wifi, Zap } from 'lucide-react';

const ITEMS = [
  { icon: Truck, text: 'Livraison 24–72h partout au Maroc' },
  { icon: Wallet, text: 'Paiement cash à la livraison' },
  { icon: ShieldCheck, text: 'Produits originaux garantis' },
  { icon: BatteryCharging, text: 'Chargeurs & batteries certifiés' },
  { icon: Wifi, text: 'Conseil en direct sur WhatsApp' },
  { icon: Cpu, text: 'Dernières générations en stock' },
  { icon: Zap, text: 'Retour sous 7 jours' },
];

export default function TechTicker() {
  return (
    <div className="overflow-hidden border-y border-border bg-foreground text-background">
      <div className="pause-on-hover flex w-max animate-marquee py-3.5">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {ITEMS.map(({ icon: Icon, text }) => (
              <span key={`${copy}-${text}`} className="flex items-center gap-2.5 px-7 text-sm font-medium">
                <Icon className="h-4 w-4 text-primary-foreground/70" strokeWidth={1.75} />
                {text}
                <span className="ml-7 h-1 w-1 rounded-full bg-background/30" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
