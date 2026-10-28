import { Headphones, PackageCheck, RefreshCcw, Wallet } from 'lucide-react';
import Reveal from '@/components/store/fx/Reveal';

const BADGES = [
  { icon: PackageCheck, label: 'Livraison partout au Maroc', sub: 'En 24 à 72h selon votre ville.' },
  { icon: Wallet,       label: 'Paiement à la livraison',     sub: 'Vous payez en cash à la réception.' },
  { icon: RefreshCcw,   label: 'Retour sous 7 jours',         sub: 'Produit intact, retour simple.' },
  { icon: Headphones,   label: 'Conseil sur WhatsApp',        sub: 'Une vraie personne vous répond.' },
];

export default function TrustBadges() {
  return (
    <section className="container-store pb-16 sm:pb-24">
      <div className="grid grid-cols-1 gap-8 border-t border-border pt-12 sm:grid-cols-2 lg:grid-cols-4">
        {BADGES.map(({ icon: Icon, label, sub }, i) => (
          <Reveal key={label} delay={i * 0.08} className="flex gap-3 sm:flex-col">
            <Icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{sub}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
