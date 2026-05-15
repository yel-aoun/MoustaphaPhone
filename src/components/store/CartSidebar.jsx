import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, CheckCircle, ArrowLeft, User, Phone, Lock, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { buildWhatsAppURL, getCartItemKey } from '@/lib/cartStore';
import { base44 } from '@/api/base44Client';
import { cloudinaryImage } from '@/lib/images';
import { trackEvent } from '@/lib/analytics';
import { toPublicUrl } from '@/lib/products';
import { getImageForColor, getProductColors } from '@/lib/productOptions';

const DELIVERY_FEE = 40;
const COMMON_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'];

export default function CartSidebar({ isOpen, onClose, cart, totalPrice, products = [], onUpdateQuantity, onUpdateVariant, onRemove, onClear }) {
  const [step, setStep] = useState('cart'); // 'cart' | 'form' | 'sending' | 'success'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPayable = cart.length > 0 ? totalPrice + DELIVERY_FEE : 0;
  const totalSavings = cart.reduce((s, item) =>
    item.original_price && item.original_price > item.price
      ? s + (item.original_price - item.price) * item.quantity
      : s, 0);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setFormError('Veuillez entrer votre nom.'); return; }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setFormError('Veuillez entrer un numéro de téléphone valide.'); return;
    }
    setFormError('');
    setStep('sending');
    const customer = {
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      note: note.trim(),
      subtotal: totalPrice,
      deliveryFee: DELIVERY_FEE,
    };
    let savedOrder = null;
    const orderItems = cart.map((item) => {
      const catalogProduct = products.find((product) => product.id === item.id);
      const imageUrl = item.selectedColor && catalogProduct
        ? getImageForColor(catalogProduct, { name: item.selectedColor, hex: item.selectedColorHex })
        : item.image_url || catalogProduct?.image_url || '';
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: imageUrl,
        selectedColor: item.selectedColor || null,
        selectedColorHex: item.selectedColorHex || null,
        product_url: item.product_url || '',
      };
    });

    try {
      savedOrder = await base44.entities.Order.create({
        customer_name: customer.name,
        customer_phone: customer.phone,
        items: orderItems,
        total: totalPayable,
        status: 'pending',
        note: [
          customer.city ? `Ville: ${customer.city}` : '',
          `Sous-total: ${totalPrice.toLocaleString('fr-MA')} DH`,
          `Livraison: ${DELIVERY_FEE.toLocaleString('fr-MA')} DH`,
          customer.note ? `Note client: ${customer.note}` : '',
        ].filter(Boolean).join('\n'),
      });
    } catch {
      // Order save failed silently — still open WhatsApp so the customer isn't blocked
    }

    trackEvent('whatsapp_checkout', {
      metadata: {
        source: 'cart_sidebar',
        item_count: totalItems,
        total: totalPayable,
      },
    });
    const trackParams = new URLSearchParams();
    trackParams.set('phone', customer.phone);
    if (savedOrder?.id) trackParams.set('id', String(savedOrder.id).slice(0, 8));
    const trackPath = `/track-order?${trackParams.toString()}`;
    const trackUrl = toPublicUrl(trackPath);
    window.open(buildWhatsAppURL(cart, totalPayable, {
      ...customer,
      orderId: savedOrder?.id,
      trackingUrl: trackUrl,
    }), '_blank');
    onClear();
    setLastOrder({
      id: savedOrder?.id || null,
      total: totalPayable,
      phone: customer.phone,
      trackingPath: trackPath,
    });
    setStep('success');
  };

  const handleClose = () => {
    setStep('cart');
    setFormError('');
    if (step === 'success') {
      setName('');
      setPhone('');
      setCity('');
      setNote('');
      setLastOrder(null);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background/95 backdrop-blur-[30px] border-l border-border z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {(step === 'form' || step === 'success') && (
                  <button onClick={() => setStep('cart')} className="mr-1 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">
                  {step === 'form' ? 'Vos coordonnées' : step === 'success' ? 'Commande enregistrée' : 'Mon Panier'}
                </h2>
                {step === 'cart' && (
                  <span className="text-sm text-muted-foreground">({totalItems})</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* ── STEP: Cart ── */}
            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                      <p className="font-medium">Votre panier est vide</p>
                      <p className="text-sm mt-1 mb-6">Ajoutez des produits pour commencer</p>
                      <button
                        onClick={handleClose}
                        className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Parcourir les produits
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {cart.map((item) => {
                          const itemKey = getCartItemKey(item);
                          const catalogProduct = products.find((product) => product.id === item.id);
                          const itemColors = getProductColors(item).length > 0
                            ? getProductColors(item)
                            : getProductColors(catalogProduct);
                          const displayImage = item.selectedColor && catalogProduct
                            ? getImageForColor(catalogProduct, { name: item.selectedColor, hex: item.selectedColorHex })
                            : item.image_url || catalogProduct?.image_url || '';
                          return (
                          <motion.div
                            key={itemKey}
                            layout
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            className="flex gap-3 p-3 rounded-xl bg-secondary/50"
                          >
                            {displayImage ? (
                              <img
                                src={cloudinaryImage(displayImage, { width: 160, height: 160, crop: 'pad' })}
                                alt={item.name}
                                className="w-16 h-16 rounded-lg border border-border bg-white object-contain p-1 shrink-0"
                              />
                            ) : (
                              <div className="flex w-16 h-16 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium leading-tight line-clamp-2">{item.name}</h4>
                              {item.selectedColor && (
                                <p className="text-xs text-muted-foreground mt-0.5">Couleur: {item.selectedColor}</p>
                              )}
                              {itemColors.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  {itemColors.map((color) => (
                                    <button
                                      key={color.name}
                                      type="button"
                                      onClick={() => onUpdateVariant?.(itemKey, color, catalogProduct)}
                                      title={color.name}
                                      aria-label={`Choisir ${color.name} dans le panier`}
                                      className={`h-5 w-5 rounded-full border transition ${
                                        getCartItemKey({ id: item.id, selectedColor: color.name, selectedColorHex: color.hex }) === itemKey
                                          ? 'scale-110 ring-2 ring-primary ring-offset-1'
                                          : 'border-border hover:scale-105'
                                      }`}
                                      style={{ backgroundColor: color.hex }}
                                    />
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.price.toLocaleString('fr-MA')} DH / unité
                              </p>
                              <p className="font-mono text-sm font-bold mt-1 text-primary">
                                {(item.price * item.quantity).toLocaleString('fr-MA')} DH
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => onUpdateQuantity(itemKey, -1)} className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono text-sm font-medium w-6 text-center">{item.quantity}</span>
                                <button onClick={() => onUpdateQuantity(itemKey, 1)} className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => onRemove(itemKey)} className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-border px-6 py-5 shrink-0 space-y-4">
                    {totalSavings > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg">
                        <span>Vous économisez</span>
                        <span className="font-mono font-bold">{totalSavings.toLocaleString('fr-MA')} DH</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Sous-total</span>
                      <span className="font-mono text-lg font-bold text-foreground">{totalPrice.toLocaleString('fr-MA')} DH</span>
                    </div>
                    <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>Livraison 24-72h selon la ville</span>
                        <span className="font-mono font-bold text-foreground">{DELIVERY_FEE.toLocaleString('fr-MA')} DH</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Paiement à la livraison
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Livraison</span>
                      <span className="font-mono font-semibold text-foreground">{DELIVERY_FEE.toLocaleString('fr-MA')} DH</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-mono text-2xl font-bold text-foreground">
                        {totalPayable.toLocaleString('fr-MA')} <span className="text-sm font-medium text-muted-foreground">DH</span>
                      </span>
                    </div>
                    <Button
                      onClick={() => setStep('form')}
                      className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl"
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Commander via WhatsApp
                      </span>
                    </Button>
                    <button
                      onClick={handleClose}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      Continuer mes achats
                    </button>
                    <button
                      onClick={onClear}
                      className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Vider le panier
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── STEP: Contact form ── */}
            {(step === 'form' || step === 'sending') && (
              <form onSubmit={handleOrderSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pour enregistrer votre commande et vous contacter via WhatsApp, veuillez renseigner vos coordonnées.
                  </p>
                  <a href="/track-order" className="inline-flex text-xs font-semibold text-primary hover:underline underline-offset-2">
                    Déjà commandé ? Suivre une commande
                  </a>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-medium">Vos données sont confidentielles et ne seront jamais partagées.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={name}
                        onChange={(e) => { setName(e.target.value); setFormError(''); }}
                        placeholder="Ex : Ahmed Benali"
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setFormError(''); }}
                        placeholder="Ex : 06 12 34 56 78"
                        className="pl-10"
                        type="tel"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      Ville de livraison</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setFormError(''); }}
                        placeholder="Ex : Casablanca"
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_CITIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCity(item)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            city === item
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Note optionnelle</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ex : livraison après 18h, couleur préférée..."
                      className="min-h-20"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-destructive">{formError}</p>
                  )}

                  {/* Order summary */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground mb-2">Récapitulatif</p>
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                        <span className="line-clamp-1 flex-1">{item.name} × {item.quantity}</span>
                        <span className="font-mono shrink-0 ml-2">{(item.price * item.quantity).toLocaleString('fr-MA')} DH</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-1.5 text-xs text-muted-foreground">
                      <span>Livraison</span>
                      <span className="font-mono">{DELIVERY_FEE.toLocaleString('fr-MA')} DH</span>
                    </div>
                    <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between font-semibold text-sm text-foreground">
                      <span>Total</span>
                      <span className="font-mono">{totalPayable.toLocaleString('fr-MA')} DH</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-border bg-background/95 px-6 py-5">
                  <Button
                    type="submit"
                    disabled={step === 'sending'}
                    className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl"
                  >
                    {step === 'sending' ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 animate-pulse" />
                        Enregistrement…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Confirmer et ouvrir WhatsApp
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 'success' && lastOrder && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
                    <h3 className="mt-3 text-xl font-bold text-foreground">Commande enregistrée</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      WhatsApp est ouvert pour confirmer la commande. Gardez ce lien pour suivre le statut.
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-secondary/25 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Code commande</span>
                      <span className="font-mono font-bold text-foreground">
                        {lastOrder.id ? String(lastOrder.id).slice(0, 8) : 'Enregistrée'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-mono font-bold text-primary">
                        {lastOrder.total.toLocaleString('fr-MA')} DH
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Téléphone</span>
                      <span className="font-semibold text-foreground">{lastOrder.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 space-y-2 border-t border-border bg-background/95 px-6 py-5">
                  <a
                    href={lastOrder.trackingPath}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Suivre ma commande
                  </a>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    Continuer mes achats
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
