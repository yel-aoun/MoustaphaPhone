import { MessageCircle, MousePointerClick, PackageCheck } from 'lucide-react';
import Reveal from '@/components/store/fx/Reveal';

const STEPS = [
  { icon: MousePointerClick, title: 'Choisissez', text: 'Ajoutez vos produits au panier en quelques secondes.' },
  { icon: MessageCircle, title: 'Confirmez sur WhatsApp', text: 'Un conseiller valide votre commande avec vous.' },
  { icon: PackageCheck, title: 'Payez à la livraison', text: 'Recevez chez vous en 24–72h et payez en cash.' },
];

export default function HowItWorks() {
  return (
    <section className="container-store pb-14 sm:pb-20">
      <Reveal>
        <h2 className="section-title">Commander, c’est simple.</h2>
        <p className="mt-1 text-sm text-muted-foreground">Trois étapes, aucun paiement en ligne.</p>
      </Reveal>
      <div className="relative mt-10">
        {/* Connection line with a travelling pulse */}
<div className="absolute left-[16%] right-[16%] top-7 hidden h-0.5 rounded-full sm:block overflow-hidden bg-border" aria-hidden="true">
          <span className="absolute inset-y-0 w-1/4 animate-slide-x bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <li className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary shadow-soft">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
                </span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
