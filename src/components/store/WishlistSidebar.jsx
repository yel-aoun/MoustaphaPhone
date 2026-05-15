import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cloudinaryImage } from '@/lib/images';

export default function WishlistSidebar({ isOpen, onClose, wishlist, onRemove, onAddToCart }) {
  const handleAdd = (product) => {
    onAddToCart(product);
    onRemove(product.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background/95 backdrop-blur-[30px] border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="font-semibold text-lg">Mes Favoris</h2>
                <span className="text-sm text-muted-foreground">({wishlist.length})</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Heart className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium">Aucun favori pour l'instant</p>
                  <p className="text-sm mt-1 mb-6 text-center">Cliquez sur ♡ sur un produit pour l'ajouter</p>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Parcourir les produits
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {wishlist.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                        className="flex gap-3 p-3 rounded-xl bg-secondary/50"
                      >
                        <img
                          src={cloudinaryImage(item.image_url, { width: 160, height: 160, crop: 'fill' })}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium leading-tight line-clamp-2">{item.name}</h4>
                          <p className="font-mono text-sm font-bold mt-1 text-primary">
                            {item.price?.toLocaleString()} MAD
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleAdd(item)}
                              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Ajouter au panier
                            </button>
                            <button
                              onClick={() => onRemove(item.id)}
                              className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
