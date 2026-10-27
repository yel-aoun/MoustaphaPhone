import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/storeEvents';
import { buildWhatsAppLink, storeBrand } from '@/lib/brand';

export default function WhatsAppFloat({ cart = [] }) {
  const hasCart = Array.isArray(cart) && cart.length > 0;
  return (
    <motion.a
      href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, j'ai une question.`)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_checkout', { metadata: { source: 'floating_button' } })}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5, damping: 15 }}
      className={`fixed right-6 z-40 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors sm:bottom-6 ${
        hasCart ? 'bottom-36' : 'bottom-24'
      }`}
    >
      <MessageCircle className="w-6 h-6" />
    </motion.a>
  );
}
