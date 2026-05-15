export function getProductImages(product) {
  return [product?.image_url, ...(product?.extra_images || [])].filter(Boolean);
}

export function getProductColors(product) {
  return Array.isArray(product?.colors)
    ? product.colors.filter((color) => color.name && color.hex)
    : [];
}

export function getColorImageIndex(color, colorIndex, images = []) {
  const linked = Array.isArray(color?.imageIndices)
    ? color.imageIndices.map((value) => Number(value))
    : [];
  const linkedIndex = linked.find((index) => Number.isInteger(index) && index >= 0 && index < images.length);
  if (linkedIndex !== undefined) return linkedIndex;
  if (colorIndex >= 0 && images[colorIndex]) return colorIndex;
  return images.length > 0 ? 0 : -1;
}

export function getColorForImage(colors = [], images = [], imageIndex = 0) {
  return colors.find((color, colorIndex) => getColorImageIndex(color, colorIndex, images) === imageIndex) || null;
}

export function getColorByName(colors = [], colorName) {
  const normalized = String(colorName || '').trim().toLowerCase();
  if (!normalized) return null;
  return colors.find((color) => String(color.name || '').trim().toLowerCase() === normalized) || null;
}

export function normalizeColorKey(colorOrName, hexValue = '') {
  const name = typeof colorOrName === 'object' && colorOrName !== null
    ? colorOrName.name
    : colorOrName;
  const hex = typeof colorOrName === 'object' && colorOrName !== null
    ? colorOrName.hex
    : hexValue;
  const normalizedName = String(name || '').trim().toLowerCase();
  const normalizedHex = String(hex || '').trim().toLowerCase();
  return [normalizedName, normalizedHex].filter(Boolean).join('|');
}

export function getImageForColor(product, colorInput) {
  const images = getProductImages(product);
  if (images.length === 0) return product?.image_url || '';

  const colors = getProductColors(product);
  const targetKey = normalizeColorKey(colorInput);
  const targetName = String(typeof colorInput === 'object' && colorInput !== null ? colorInput.name : colorInput || '')
    .trim()
    .toLowerCase();
  const colorIndex = colors.findIndex((color) => (
    (targetKey && normalizeColorKey(color) === targetKey) ||
    (!targetKey && targetName && String(color.name || '').trim().toLowerCase() === targetName)
  ));
  if (colorIndex < 0) return images[0];

  const imageIndex = getColorImageIndex(colors[colorIndex], colorIndex, images);
  return images[imageIndex] || images[0] || '';
}
