import { useEffect } from 'react';
import { brandTitle, storeBrand } from '@/lib/brand';

const DEFAULT_TITLE = `${storeBrand.name} - ${storeBrand.tagline}`;
const DEFAULT_DESCRIPTION = storeBrand.description;

function ensureMeta(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  const el = ensureMeta(`meta[${attr}="${name}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    return meta;
  });
  el.setAttribute('content', content);
}

function setCanonical(url) {
  if (!url) return;
  const el = ensureMeta('link[rel="canonical"]', () => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    return link;
  });
  el.setAttribute('href', url);
}

function setJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = 'website',
  jsonLd,
} = {}) {
  useEffect(() => {
    const fullTitle = brandTitle(title);
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', type, 'property');
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);

    if (url) {
      setCanonical(url);
      setMeta('og:url', url, 'property');
    }
    if (image) {
      setMeta('og:image', image, 'property');
      setMeta('twitter:image', image);
    }

    setJsonLd('store-jsonld', jsonLd);

    return () => setJsonLd('store-jsonld', null);
  }, [description, image, jsonLd, title, type, url]);
}

export function productJsonLd(product, url) {
  if (!product) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: [product.image_url, ...(product.extra_images || [])].filter(Boolean),
    category: product.category || undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MAD',
      price: product.price,
      availability: product.status === 'out_of_stock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };
}
