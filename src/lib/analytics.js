const ANALYTICS_URL = '/api/analytics';

export function trackEvent(eventType, payload = {}) {
  const event = {
    event_type: eventType,
    ...payload,
    metadata: {
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      ...(payload.metadata || {}),
    },
  };

  const body = JSON.stringify(event);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ANALYTICS_URL, blob);
      return;
    }
  } catch {
    // Fall back to fetch.
  }

  fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackProductEvent(eventType, product, metadata = {}) {
  if (!product) return;
  trackEvent(eventType, {
    product_id: product.id,
    product_name: product.name,
    metadata,
  });
}
