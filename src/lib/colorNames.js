// Suggest a French color name from a hex value, so swatches saved without a
// name still appear in the store (unnamed colors used to be dropped silently).
function hexToHsl(hex) {
  const clean = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

export function suggestColorName(hex) {
  const hsl = hexToHsl(hex);
  if (!hsl) return 'Couleur';
  const { h, s, l } = hsl;
  if (l < 0.12) return 'Noir';
  if (l > 0.93) return 'Blanc';
  if (s < 0.12) return l > 0.65 ? 'Argent' : 'Gris';
  if (h < 15 || h >= 345) return l < 0.35 ? 'Bordeaux' : 'Rouge';
  if (h >= 20 && h < 65 && s < 0.6 && l > 0.65) return 'Beige';
  if (h < 40) return l < 0.4 ? 'Marron' : 'Orange';
  if (h < 52 && s < 0.8) return 'Doré';
  if (h < 70) return 'Jaune';
  if (h < 160) return l < 0.3 ? 'Vert foncé' : 'Vert';
  if (h < 200) return 'Turquoise';
  if (h < 255) return l < 0.3 ? 'Bleu nuit' : 'Bleu';
  if (h < 290) return 'Violet';
  return 'Rose';
}
