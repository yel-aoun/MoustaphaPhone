import { Link } from 'react-router-dom';
import { ArrowRight, Tag, X } from 'lucide-react';

export default function PromotionStrip({ discount, onDismiss }) {
  return (
    <aside aria-label="Offres du moment" className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-center bg-orange-700 px-12 text-white">
      <Link to="/boutique?sale=1" className="flex min-h-11 min-w-0 items-center justify-center gap-2 text-xs font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:text-sm">
        <Tag className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
        <span className="truncate">Jusqu’à −{discount} % sur une sélection</span>
        <span className="hidden sm:inline">· Voir les offres</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
      <button type="button" onClick={onDismiss} aria-label="Fermer le bandeau des promotions"
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
