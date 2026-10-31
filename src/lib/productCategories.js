export const PRODUCT_CATEGORIES = [
  'Audio',
  'Wearables',
  'Displays',
  'Peripherals',
  'Phones',
  'Accessories',
];

export const PRODUCT_CATEGORY_FILTERS = ['Tous', ...PRODUCT_CATEGORIES];

// Display translations preserve stored category identities and existing URLs.
const CATEGORY_LABELS = {
  Accessories: 'Accessoires',
  Phones: 'Téléphones',
  Wearables: 'Montres connectées',
  Displays: 'Écrans',
  Peripherals: 'Périphériques',
};

export function categoryLabel(name) {
  return CATEGORY_LABELS[name] || name || '';
}
