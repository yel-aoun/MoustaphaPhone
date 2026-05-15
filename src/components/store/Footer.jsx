import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { motion, AnimatePresence } from 'framer-motion';
import ZelligePattern from './ZelligePattern';
import BrandLogo from '@/components/brand/BrandLogo';
import { buildWhatsAppLink, storeBrand } from '@/lib/brand';

const LEGAL_PAGES = {
  'Livraison & retours': {
    content: [
      { heading: 'Délais de livraison', body: 'Vos commandes sont livrées sous 2 à 5 jours ouvrables partout au Maroc. Les grandes villes (Casablanca, Rabat, Marrakech, Fès) bénéficient généralement d\'une livraison en 1 à 2 jours.' },
      { heading: 'Frais de livraison', body: 'La livraison est offerte pour toute commande supérieure à 500 MAD. En dessous de ce montant, des frais de port s\'appliquent selon votre région.' },
      { heading: 'Retours', body: 'Vous disposez de 7 jours à compter de la réception pour retourner un article. Le produit doit être dans son emballage d\'origine, non utilisé et en parfait état. Contactez-nous via WhatsApp pour initier un retour.' },
      { heading: 'Remboursements', body: 'Une fois le retour validé, le remboursement est effectué sous 3 à 5 jours ouvrables par le même moyen de paiement utilisé lors de la commande.' },
    ],
  },
  'Conditions générales de vente': {
    content: [
      { heading: 'Objet', body: `Les présentes conditions générales de vente s'appliquent à toutes les transactions effectuées sur ${storeBrand.name}. En passant commande, vous acceptez ces conditions sans réserve.` },
      { heading: 'Prix', body: `Tous les prix sont indiqués en Dirhams marocains (MAD) TTC. ${storeBrand.name} se réserve le droit de modifier ses prix à tout moment, mais les produits seront facturés au tarif en vigueur au moment de la validation de la commande.` },
      { heading: 'Commande', body: 'La commande est validée après confirmation via WhatsApp par notre équipe. Nous nous réservons le droit d\'annuler toute commande en cas d\'indisponibilité du produit ou d\'anomalie de prix.' },
      { heading: 'Responsabilité', body: `${storeBrand.name} s'engage à mettre en œuvre tous les moyens nécessaires pour assurer la satisfaction du client. Notre responsabilité ne saurait être engagée pour des dommages indirects résultant de l'utilisation des produits.` },
    ],
  },
  'Politique de confidentialité': {
    content: [
      { heading: 'Données collectées', body: 'Lors de vos achats, nous collectons uniquement les informations nécessaires au traitement de votre commande : nom, adresse de livraison et numéro de téléphone.' },
      { heading: 'Utilisation des données', body: 'Vos données personnelles sont utilisées exclusivement pour le traitement et le suivi de vos commandes. Elles ne sont jamais vendues ni partagées avec des tiers à des fins commerciales.' },
      { heading: 'Cookies', body: 'Notre site utilise des cookies techniques indispensables au bon fonctionnement du site (panier, préférences). Aucun cookie de traçage publicitaire n\'est utilisé.' },
      { heading: 'Vos droits', body: 'Conformément à la loi marocaine n°09-08 relative à la protection des personnes physiques, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Contactez-nous via WhatsApp pour exercer ces droits.' },
    ],
  },
  'Nous contacter': {
    content: [
      { heading: 'WhatsApp', body: 'Le moyen le plus rapide pour nous joindre. Notre équipe répond 7j/7 de 9h à 21h. Cliquez sur le bouton WhatsApp flottant pour démarrer une conversation.' },
      { heading: 'Instagram', body: 'Suivez-nous sur Instagram pour découvrir nos nouvelles arrivées, promotions exclusives et actualités.' },
      { heading: 'Horaires', body: 'Notre service client est disponible du lundi au dimanche, de 9h00 à 21h00 (heure du Maroc). Nous répondons généralement dans l\'heure pendant les heures ouvrables.' },
      { heading: 'Réclamations', body: 'Pour toute réclamation, contactez-nous via WhatsApp en précisant votre numéro de commande. Nous traitons chaque réclamation dans un délai de 24 à 48 heures.' },
    ],
  },
};

export default function Footer({ onCategorySelect }) {
  const { data: categories = [] } = useCategories();
  const [openModal, setOpenModal] = useState(null);

  const handleCategoryClick = (name) => {
    onCategorySelect?.(name);
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  };

  const modalData = openModal ? LEGAL_PAGES[openModal] : null;

  return (
    <>
      <footer className="relative border-t border-border mt-0 bg-secondary/40 overflow-hidden">
        <ZelligePattern id="footer" opacity={0.06} />

        {/* Brand header — centered logo + tagline */}
        <div className="relative border-b border-border/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col items-center gap-4">
            <BrandLogo size="lg" />
            <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
              {storeBrand.description}
            </p>
            <div className="flex gap-2.5 mt-1">
              <a
                href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, je souhaite vous contacter.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Nous contacter
              </a>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">

            {/* Catégories */}
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5">
                Catégories
              </h4>
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.name}>
                    <button
                      onClick={() => handleCategoryClick(cat.name)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Informations */}
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5">
                Informations
              </h4>
              <ul className="space-y-3">
                {Object.keys(LEGAL_PAGES).map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => setOpenModal(link)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Commander */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5">
                Commander
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Commandez directement via WhatsApp. Notre équipe vous répond {storeBrand.supportHours}.
              </p>
              <a
                href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, je souhaite commander.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium hover:underline underline-offset-2 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {storeBrand.whatsappDisplay}
              </a>
              <a
                href="/track-order"
                className="mt-3 block text-sm font-medium text-primary hover:underline underline-offset-2"
              >
                Suivre une commande
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {storeBrand.name}. Tous droits réservés.</p>
            <p>Fait avec ♥ au Maroc</p>
          </div>
        </div>
      </footer>

      {/* Legal modal */}
      <AnimatePresence>
        {openModal && modalData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenModal(null)}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-full sm:w-[560px] max-h-[80vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <h2 className="font-semibold text-foreground">{openModal}</h2>
                <button
                  onClick={() => setOpenModal(null)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-5 space-y-5">
                {modalData.content.map(({ heading, body }) => (
                  <div key={heading}>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{heading}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
