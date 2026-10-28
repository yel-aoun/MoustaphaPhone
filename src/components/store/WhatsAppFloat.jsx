import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/storeEvents';
import { buildWhatsAppLink, storeBrand } from '@/lib/brand';

export default function WhatsAppFloat() {
  return (
    <motion.a
      href={buildWhatsAppLink(`Bonjour ${storeBrand.name}, j'ai une question.`)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_checkout', { metadata: { source: 'floating_button' } })}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5, damping: 15 }}
      aria-label="Contacter sur WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15 transition-transform hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14"
    >
      <MessageCircle className="h-6 w-6" />
    </motion.a>
  );
}
