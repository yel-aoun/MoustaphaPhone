export function cloudinaryImage(url, options = {}) {
  if (!url || !String(url).includes('/image/upload/')) return url || '';
  if (!options.transform) return url;

  const transforms = [
    'f_auto',
    'q_auto',
    options.crop ? `c_${options.crop}` : 'c_limit',
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
  ].filter(Boolean).join(',');

  return String(url).replace('/image/upload/', `/image/upload/${transforms}/`);
}

export function productImageSrcSet(url, widths = [320, 640, 960], options = {}) {
  if (!options.transform || !url || !String(url).includes('/image/upload/')) return undefined;
  return widths.map((width) => `${cloudinaryImage(url, { width, transform: true })} ${width}w`).join(', ');
}
