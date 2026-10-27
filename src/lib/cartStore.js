import { useState, useEffect, useCallback } from 'react';
import { getProductUrl, toPublicUrl } from '@/lib/products';
import { getColorByName, getImageForColor, getProductColors, normalizeColorKey } from '@/lib/productOptions';
import { buildWhatsAppLink, storagePrefix, storeBrand } from '@/lib/brand';

const CART_KEY = `${storagePrefix}_cart`;

export function getCartItemKey(item) {
  if (!item) return '';
  const variantKey = normalizeColorKey(item.selectedColor, item.selectedColorHex) || item.selectedColorKey;
  if (variantKey) return `${item.id}::${variantKey}`;
  if (item.cart_key && item.cart_key !== item.id) return item.cart_key;
  return `${item.id}`;
}

function getVariantMeta(product, selectedColorInput = null) {
  const colors = getProductColors(product);
  const selectedColorObject = typeof selectedColorInput === 'object' && selectedColorInput !== null
    ? selectedColorInput
    : getColorByName(colors, selectedColorInput || product?.selectedColor);
  const selectedColor = selectedColorObject?.name || product?.selectedColor || (typeof selectedColorInput === 'string' ? selectedColorInput : null);
  const selectedColorHex = selectedColorObject?.hex || product?.selectedColorHex || null;
  const selectedColorKey = normalizeColorKey(selectedColor, selectedColorHex);

  return {
    colors,
    selectedColor: selectedColor || null,
    selectedColorHex,
    selectedColorKey,
    image_url: selectedColor ? getImageForColor(product, selectedColorObject || selectedColor) : (product?.image_url || ''),
  };
}

function getCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    localStorage.removeItem(CART_KEY);
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* give up */ }
  }
  window.dispatchEvent(new Event('cart-updated'));
}

export function useCart() {
  const [cart, setCart] = useState(getCart);

  useEffect(() => {
    const handler = () => setCart(getCart());
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, []);

  const addToCart = useCallback((product) => {
    if (!product?.id) {
      console.warn('addToCart: product is missing an id', product);
      return;
    }
    const current = getCart();
    const variant = getVariantMeta(product);
    const cartKey = getCartItemKey({ id: product.id, ...variant });
    const extraImages = Array.isArray(product.extra_images) ? product.extra_images : [];
    const existing = current.find(item => getCartItemKey(item) === cartKey);
    if (existing) {
      existing.quantity += 1;
      existing.image_url = variant.image_url || product.image_url || existing.image_url;
      existing.extra_images = extraImages.length > 0 ? extraImages : existing.extra_images || [];
      existing.colors = variant.colors.length > 0 ? variant.colors : existing.colors || [];
      existing.selectedColor = variant.selectedColor;
      existing.selectedColorHex = variant.selectedColorHex;
      existing.selectedColorKey = variant.selectedColorKey;
      existing.cart_key = cartKey;
    } else {
      // Store only the fields needed by the cart UI to keep localStorage small
      current.push({
        cart_key: cartKey,
        id: product.id,
        name: product.name,
        price: product.price,
        original_price: product.original_price ?? null,
        image_url: variant.image_url || product.image_url,
        extra_images: extraImages,
        colors: variant.colors,
        product_url: product.product_url || getProductUrl(product),
        selectedColor: variant.selectedColor,
        selectedColorHex: variant.selectedColorHex,
        selectedColorKey: variant.selectedColorKey,
        quantity: 1,
      });
    }
    saveCart(current);
  }, []);

  const removeFromCart = useCallback((itemKey) => {
    const current = getCart().filter(item => getCartItemKey(item) !== itemKey);
    saveCart(current);
  }, []);

  const updateQuantity = useCallback((itemKey, delta) => {
    const current = getCart();
    const item = current.find(i => getCartItemKey(i) === itemKey);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      saveCart(current.filter(i => getCartItemKey(i) !== itemKey));
    } else {
      saveCart(current);
    }
  }, []);

  const updateVariant = useCallback((itemKey, nextColor, sourceProduct = null) => {
    const current = getCart();
    const index = current.findIndex(item => getCartItemKey(item) === itemKey);
    if (index < 0) return;

    const item = current[index];
    const productForImages = sourceProduct || item;
    const variant = getVariantMeta(productForImages, nextColor);
    const extraImages = Array.isArray(productForImages.extra_images) ? productForImages.extra_images : (item.extra_images || []);
    const nextItem = {
      ...item,
      colors: variant.colors.length > 0 ? variant.colors : item.colors || [],
      extra_images: extraImages,
      selectedColor: variant.selectedColor,
      selectedColorHex: variant.selectedColorHex,
      selectedColorKey: variant.selectedColorKey,
      image_url: variant.image_url || productForImages.image_url || item.image_url || '',
    };
    nextItem.cart_key = getCartItemKey(nextItem);
    const currentKey = getCartItemKey(item);
    if (nextItem.cart_key === currentKey) return;

    const duplicateIndex = current.findIndex((entry, entryIndex) =>
      entryIndex !== index && getCartItemKey(entry) === nextItem.cart_key
    );

    if (item.quantity > 1) {
      current[index] = { ...item, quantity: item.quantity - 1, cart_key: currentKey };
      if (duplicateIndex >= 0) {
        current[duplicateIndex] = {
          ...current[duplicateIndex],
          quantity: current[duplicateIndex].quantity + 1,
          image_url: nextItem.image_url || current[duplicateIndex].image_url,
          selectedColor: nextItem.selectedColor,
          selectedColorHex: nextItem.selectedColorHex,
          selectedColorKey: nextItem.selectedColorKey,
          colors: nextItem.colors || current[duplicateIndex].colors || [],
          extra_images: nextItem.extra_images || current[duplicateIndex].extra_images || [],
        };
      } else {
        current.splice(index + 1, 0, { ...nextItem, quantity: 1 });
      }
      saveCart(current);
      return;
    }

    if (duplicateIndex >= 0) {
      current[duplicateIndex] = {
        ...current[duplicateIndex],
        quantity: current[duplicateIndex].quantity + item.quantity,
        image_url: nextItem.image_url || current[duplicateIndex].image_url,
        selectedColor: nextItem.selectedColor,
        selectedColorHex: nextItem.selectedColorHex,
        selectedColorKey: nextItem.selectedColorKey,
        colors: nextItem.colors || current[duplicateIndex].colors || [],
        extra_images: nextItem.extra_images || current[duplicateIndex].extra_images || [],
      };
      current.splice(index, 1);
    } else {
      current[index] = nextItem;
    }
    saveCart(current);
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { cart, addToCart, removeFromCart, updateQuantity, updateVariant, clearCart, totalItems, totalPrice };
}

export function buildWhatsAppURL(cart, total, customer = {}) {
  const orderCode = customer.orderId ? String(customer.orderId).slice(0, 8) : '';
  const trackingUrl = customer.trackingUrl ? toPublicUrl(customer.trackingUrl) : '';
  const deliveryFee = Number(customer.deliveryFee || 0);
  const subtotal = Number(customer.subtotal || total - deliveryFee || total);
  let message = `Bonjour ${storeBrand.name},\n\n`;

  message += 'Je souhaite confirmer cette commande';
  if (orderCode) message += ` #${orderCode}`;
  message += '.\n\n';

  if (customer.name || customer.phone || customer.city) {
    message += '*Coordonnées client*\n';
    if (customer.name) message += `Nom: ${customer.name}\n`;
    if (customer.phone) message += `Téléphone: ${customer.phone}\n`;
    if (customer.city) message += `Ville: ${customer.city}\n`;
    message += '\n';
  }

  message += '*Articles commandés*\n';
  cart.forEach((item, i) => {
    const color = item.selectedColor ? ` (${item.selectedColor})` : '';
    const itemTotal = (item.price * item.quantity).toLocaleString('fr-MA');
    message += `${i + 1}. ${item.name}${color}\n`;
    message += `   Quantité: ${item.quantity}\n`;
    message += `   Total article: ${itemTotal} MAD\n`;
    const url = toPublicUrl(item.product_url || getProductUrl(item));
    if (url) message += `   Voir le produit:\n   ${url}\n`;
  });

  message += '\n*Récapitulatif*\n';
  if (deliveryFee > 0) {
    message += `Sous-total: ${subtotal.toLocaleString('fr-MA')} MAD\n`;
    message += `Livraison: ${deliveryFee.toLocaleString('fr-MA')} MAD\n`;
  }
  message += `*Total à payer: ${total.toLocaleString('fr-MA')} MAD*`;

  if (orderCode || trackingUrl) {
    message += '\n\n*Suivi de commande*\n';
    if (orderCode) message += `Code: #${orderCode}\n`;
    if (trackingUrl) {
      message += 'Lien de suivi:\n';
      message += `${trackingUrl}\n`;
    }
  }

  if (customer.note) message += `\n\nNote: ${customer.note}`;
  message += '\n\nMerci de confirmer la disponibilité et le délai de livraison.';
  return buildWhatsAppLink(message);
}
