export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function productPath(product) {
  const base = slugify(product.name) || 'produit';
  const suffix = product.id ? `-${String(product.id).slice(0, 8)}` : '';
  return `/product/${base}${suffix}`;
}
