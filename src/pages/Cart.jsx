import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { buildWhatsAppURL, getCartItemKey, useCart } from '@/lib/cartStore';
import { cloudinaryImage } from '@/lib/images';
import { trackEvent } from '@/lib/storeEvents';
import { formatMoney, getProductPath, toPublicUrl } from '@/lib/products';
import { getImageForColor, getProductColors } from '@/lib/productOptions';
import { useSeo } from '@/lib/seo';
import { motion } from 'framer-motion';
import StoreLayout, { useStoreProducts } from '@/components/store/StoreLayout';
import CircuitBackground from '@/components/store/fx/CircuitBackground';

const DELIVERY_FEE = 40;
const COMMON_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'];

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'text-base font-semibold text-foreground' : 'text-sm text-muted-foreground'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'text-foreground'}>{value}</span>
    </div>
  );
}

export default function Cart() {
  const { products } = useStoreProducts();
  const { cart, updateQuantity, updateVariant, removeFromCart, clearCart, totalPrice } = useCart();
  const [step, setStep] = useState('cart'); // 'cart' | 'form' | 'sending' | 'success'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [lastOrder, setLastOrder] = useState(null);

  useSeo({ title: 'Panier', url: window.location.href });

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPayable = cart.length > 0 ? totalPrice + DELIVERY_FEE : 0;
  const totalSavings = cart.reduce((s, item) =>
    item.original_price && item.original_price > item.price
      ? s + (item.original_price - item.price) * item.quantity
      : s, 0);

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
      // Order save failed — still open WhatsApp so the customer isn't blocked
    }

    trackEvent('whatsapp_checkout', {
      metadata: { source: 'cart_page', item_count: totalItems, total: totalPayable },
    });
    const trackParams = new URLSearchParams();
    trackParams.set('phone', customer.phone);
    if (savedOrder?.id) trackParams.set('id', String(savedOrder.id).slice(0, 8));
    const trackPath = `/track-order?${trackParams.toString()}`;
    window.open(buildWhatsAppURL(cart, totalPayable, {
      ...customer,
      orderId: savedOrder?.id,
      trackingUrl: toPublicUrl(trackPath),
    }), '_blank');
    clearCart();
    setLastOrder({ id: savedOrder?.id || null, total: totalPayable, phone: customer.phone, trackingPath: trackPath });
    setStep('success');
  };

  if (step === 'success' && lastOrder) {
    return (
      <StoreLayout>
        <div className="container-store flex max-w-xl flex-col items-center py-20 text-center">
          <CheckCircle className="h-14 w-14 text-primary" strokeWidth={1.5} />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">Merci, commande enregistrée.</h1>
          <p className="mt-3 text-muted-foreground">
            WhatsApp s'est ouvert pour confirmer votre commande. Gardez ce code pour la suivre.
          </p>
          <div className="mt-8 w-full space-y-3 rounded-2xl bg-secondary p-6 text-left">
            <SummaryRow label="Code commande" value={lastOrder.id ? String(lastOrder.id).slice(0, 8) : 'Enregistrée'} />
            <SummaryRow label="Téléphone" value={lastOrder.phone} />
            <SummaryRow label="Total à payer à la livraison" value={formatMoney(lastOrder.total)} strong />
          </div>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Link to={lastOrder.trackingPath} className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              Suivre ma commande
            </Link>
            <Link to="/boutique" className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border text-sm font-medium text-foreground">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (cart.length === 0) {
    return (
      <StoreLayout>
        <div className="relative overflow-hidden">
        <CircuitBackground className="text-foreground" />
        <div className="container-store relative flex flex-col items-center py-24 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-foreground/20" />
            <span className="absolute inset-3 rounded-full bg-secondary" />
            <ShoppingBag className="relative h-10 w-10 animate-float text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">Votre panier est vide.</h1>
          <p className="mt-2 text-muted-foreground">Découvrez nos téléphones et accessoires.</p>
          <Link to="/boutique" className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground">
            Aller à la boutique
          </Link>
        </div>
        </div>
      </StoreLayout>
    );
  }

  const isForm = step === 'form' || step === 'sending';

  return (
    <StoreLayout hideTabBar hideWhatsApp>
      <div className="container-store pb-10 pt-8 sm:pt-12">
        {isForm ? (
          <button type="button" onClick={() => setStep('cart')} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Retour au panier
          </button>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">{totalItems} article{totalItems > 1 ? 's' : ''}</p>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {isForm ? 'Vos coordonnées' : 'Votre panier'}
        </h1>

        {/* Steps — a progress bar that "charges" as you advance */}
        <div className="mt-6 max-w-xl">
          <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-sky-500"
              initial={false}
              animate={{ width: isForm ? '66%' : '33%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="absolute inset-0 animate-marquee bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] bg-[length:50%_100%] bg-repeat-x" />
          </div>
          <ol className="mt-2 grid grid-cols-3 text-xs font-medium">
            {['Panier', 'Coordonnées', 'WhatsApp'].map((label, i) => {
              const reached = i === 0 || (i === 1 && isForm);
              return (
                <li key={label} className={`${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''} ${reached ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          {!isForm ? (
            <ul className="divide-y divide-border border-y border-border">
              {cart.map((item) => {
                const itemKey = getCartItemKey(item);
                const catalogProduct = products.find((product) => product.id === item.id);
                const itemColors = getProductColors(item).length > 0 ? getProductColors(item) : getProductColors(catalogProduct);
                const displayImage = item.selectedColor && catalogProduct
                  ? getImageForColor(catalogProduct, { name: item.selectedColor, hex: item.selectedColorHex })
                  : item.image_url || catalogProduct?.image_url || '';
                const productPath = catalogProduct ? getProductPath(catalogProduct) : null;
                return (
                  <li key={itemKey} className="flex gap-4 py-6 sm:gap-6">
                    <div className="photo-well h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-32 sm:w-32">
                      {displayImage ? (
                        <img
                          src={cloudinaryImage(displayImage, { width: 260, height: 260, crop: 'pad' })}
                          alt={item.name}
                          className="h-full w-full bg-transparent object-contain p-2 mix-blend-multiply"
                        />
                      ) : (
                        <ShoppingBag className="m-auto mt-8 h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {productPath ? (
                            <Link to={productPath} className="text-base font-medium text-foreground hover:underline">{item.name}</Link>
                          ) : (
                            <p className="text-base font-medium text-foreground">{item.name}</p>
                          )}
                          {item.selectedColor && <p className="mt-0.5 text-sm text-muted-foreground">{item.selectedColor}</p>}
                        </div>
                        <p className="shrink-0 text-base font-semibold text-foreground">{formatMoney(item.price * item.quantity)}</p>
                      </div>

                      {itemColors.length > 1 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {itemColors.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => updateVariant?.(itemKey, color, catalogProduct)}
                              title={color.name}
                              aria-label={`Choisir ${color.name}`}
                              className={`h-5 w-5 rounded-full ring-1 ring-inset ring-black/10 transition ${
                                getCartItemKey({ id: item.id, selectedColor: color.name, selectedColorHex: color.hex }) === itemKey
                                  ? 'outline outline-2 outline-offset-2 outline-foreground'
                                  : ''
                              }`}
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <div className="flex items-center rounded-full border border-border">
                          <button onClick={() => updateQuantity(itemKey, -1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary" aria-label="Diminuer la quantité">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(itemKey, 1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary" aria-label="Augmenter la quantité">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(itemKey)} className="text-sm font-medium text-primary hover:underline">
                          Retirer
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <form id="checkout-form" onSubmit={handleOrderSubmit} className="space-y-6">
              <p className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                Vos données servent uniquement à livrer votre commande.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nom complet</label>
                <Input value={name} onChange={(e) => { setName(e.target.value); setFormError(''); }} placeholder="Ex : Ahmed Benali" className="h-12 rounded-xl" required autoFocus />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Téléphone
                </label>
                <Input value={phone} onChange={(e) => { setPhone(e.target.value); setFormError(''); }} placeholder="Ex : 06 12 34 56 78" type="tel" className="h-12 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ville de livraison</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Casablanca" className="h-12 rounded-xl" />
                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_CITIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCity(item)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        city === item ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-muted'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Note (optionnel)</label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : livraison après 18h" className="min-h-24 rounded-xl" />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Link to="/track-order" className="inline-block text-sm font-medium text-primary hover:underline">
                Déjà commandé ? Suivre une commande
              </Link>
            </form>
          )}

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 rounded-3xl bg-secondary p-6">
              <h2 className="text-lg font-semibold text-foreground">Récapitulatif</h2>
              {isForm && (
                <ul className="space-y-2 border-b border-border pb-4">
                  {cart.map((item) => (
                    <li key={getCartItemKey(item)} className="flex justify-between gap-3 text-sm text-muted-foreground">
                      <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                      <span className="shrink-0 text-foreground">{formatMoney(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <SummaryRow label="Sous-total" value={formatMoney(totalPrice)} />
              <SummaryRow label="Livraison" value={formatMoney(DELIVERY_FEE)} />
              {totalSavings > 0 && <SummaryRow label="Économies" value={`−${formatMoney(totalSavings)}`} />}
              <div className="border-t border-border pt-4">
                <SummaryRow label="Total" value={formatMoney(totalPayable)} strong />
                <p className="mt-1 text-xs text-muted-foreground">À payer en cash à la livraison.</p>
              </div>

              <div className="hidden lg:block">
                {isForm ? (
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={step === 'sending'}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white disabled:opacity-60"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {step === 'sending' ? 'Enregistrement…' : 'Confirmer sur WhatsApp'}
                  </button>
                ) : (
                  <button type="button" onClick={() => setStep('form')} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    Passer la commande
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Livraison 24-72h partout au Maroc</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Retour accepté sous 7 jours</p>
              </div>
            </div>
            {!isForm && (
              <button type="button" onClick={clearCart} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Vider le panier
              </button>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile sticky action */}
      <div className="liquid-glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-[26px] px-3 pb-3 pt-2.5 lg:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">{formatMoney(totalPayable)}</span>
        </div>
        {isForm ? (
          <button
            type="submit"
            form="checkout-form"
            disabled={step === 'sending'}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white disabled:opacity-60"
          >
            <MessageCircle className="h-4 w-4" />
            {step === 'sending' ? 'Enregistrement…' : 'Confirmer sur WhatsApp'}
          </button>
        ) : (
          <button type="button" onClick={() => setStep('form')} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground">
            Passer la commande
          </button>
        )}
      </div>
    </StoreLayout>
  );
}
