import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

const OUTPUT_DIR = 'exports';
const MARKDOWN_FILE = path.join(OUTPUT_DIR, 'facebook-marketplace-listings.md');
const CSV_FILE = path.join(OUTPUT_DIR, 'facebook-marketplace-listings.csv');
const JSON_FILE = path.join(OUTPUT_DIR, 'facebook-marketplace-listings.json');
let storeName = 'Client Store';

function readEnv(filePath = '.env') {
  const env = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    env[key] = rawValue.replace(/^["']|["']$/g, '');
  }

  return env;
}

function cleanWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripModelNoise(name) {
  return cleanWhitespace(name)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function shortenTitle(title, maxLength = 96) {
  if (title.length <= maxLength) return title;

  const shortened = title.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 55 ? lastSpace : maxLength - 1).trim()}...`;
}

function titleForProduct(product) {
  const baseTitle = stripModelNoise(product.name);
  const prefix = /logitech/i.test(baseTitle) ? '' : 'Logitech ';
  return shortenTitle(`${prefix}${baseTitle}`.trim());
}

function detectProductType(product) {
  const text = `${product.name} ${product.description}`.toLowerCase();

  if (text.includes('clavier') && text.includes('souris')) {
    return {
      label: 'ensemble clavier et souris',
      category: 'Accessoires informatiques',
      facebookCategory: 'Electronics > Computer Accessories > Keyboards & Mice',
      keywords: ['pack clavier souris', 'combo clavier souris', 'clavier souris sans fil'],
    };
  }

  if (text.includes('clavier')) {
    return {
      label: 'clavier',
      category: 'Accessoires informatiques',
      facebookCategory: 'Electronics > Computer Accessories > Keyboards',
      keywords: ['clavier Logitech', 'clavier AZERTY', 'clavier sans fil'],
    };
  }

  if (text.includes('souris')) {
    const wireless = text.includes('sans fil') || text.includes('bluetooth');
    return {
      label: wireless ? 'souris sans fil' : 'souris',
      category: 'Accessoires informatiques',
      facebookCategory: 'Electronics > Computer Accessories > Mice',
      keywords: wireless
        ? ['souris Logitech', 'souris sans fil', 'souris Bluetooth']
        : ['souris Logitech', 'souris filaire', 'souris USB'],
    };
  }

  return {
    label: 'accessoire informatique',
    category: 'Accessoires informatiques',
    facebookCategory: 'Electronics > Computer Accessories',
    keywords: ['accessoire informatique', 'accessoire PC', 'Logitech'],
  };
}

function featureKeywords(product) {
  const text = `${product.name} ${product.description}`.toLowerCase();
  const keywords = [];

  const checks = [
    ['bluetooth', 'Bluetooth'],
    ['sans fil', 'sans fil'],
    ['filaire', 'filaire'],
    ['azerty', 'AZERTY'],
    ['français', 'français'],
    ['silent', 'silencieux'],
    ['ergonomique', 'ergonomique'],
    ['compact', 'compact'],
    ['mac', 'Mac'],
    ['usb', 'USB'],
    ['rechargeable', 'rechargeable'],
    ['bureau', 'bureau'],
  ];

  for (const [needle, keyword] of checks) {
    if (text.includes(needle)) keywords.push(keyword);
  }

  return keywords;
}

function unique(values) {
  return [...new Set(values.map(cleanWhitespace).filter(Boolean))];
}

function keywordsForProduct(product, typeInfo) {
  const modelMatches = cleanWhitespace(product.name).match(/\b(MX|MK|M|K)\s*-?\s?\d{2,4}[A-Za-z]*\b/gi) || [];

  return unique([
    ...typeInfo.keywords,
    ...featureKeywords(product),
    ...modelMatches.map((value) => value.replace(/\s+/g, '')),
    'Logitech Maroc',
    'accessoire PC',
    'bureautique',
    storeName,
  ]);
}

function normalizeDescription(product) {
  const description = cleanWhitespace(product.description)
    .replace(/^,\s*/, '')
    .replace(/^\.\s*/, '');

  return description || `Produit ${product.name} disponible chez ${storeName}.`;
}

function descriptionForProduct(product, keywords) {
  const originalDescription = normalizeDescription(product);
  const imageCount = 1 + (Array.isArray(product.extra_images) ? product.extra_images.length : 0);
  const colors = Array.isArray(product.colors) && product.colors.length
    ? `\nCouleurs disponibles : ${product.colors.map((color) => color.name || color.label || color).join(', ')}.`
    : '';

  return [
    originalDescription,
    colors,
    '',
    `Disponible chez ${storeName}.`,
    'Etat : neuf.',
    'Prix : fixe sauf promotion indiquee.',
    `Images disponibles : ${imageCount}.`,
    '',
    `Mots cles utiles : ${keywords.join(', ')}.`,
  ].join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function allImages(product) {
  return unique([product.image_url, ...(Array.isArray(product.extra_images) ? product.extra_images : [])]);
}

function money(value) {
  return Number(value || 0).toLocaleString('fr-MA');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  const headers = [
    'id',
    'title',
    'price',
    'currency',
    'condition',
    'availability',
    'suggested_facebook_category',
    'local_category',
    'description',
    'keywords',
    'main_image_url',
    'extra_image_urls',
    'all_image_urls',
  ];

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
}

function markdownForListings(listings) {
  const generatedAt = new Date().toISOString();
  const lines = [
    '# Facebook Marketplace Listing Pack',
    '',
    `Generated: ${generatedAt}`,
    `Products: ${listings.length}`,
    '',
    'Use each block as a reviewable listing draft. Facebook Marketplace may not expose a real "tags" field, so put the keyword line naturally at the end of the description.',
    '',
  ];

  for (const [index, listing] of listings.entries()) {
    lines.push(
      `## ${index + 1}. ${listing.title}`,
      '',
      `Price: ${money(listing.price)} ${listing.currency}`,
      `Condition: ${listing.condition}`,
      `Availability: ${listing.availability}`,
      `Suggested category: ${listing.suggested_facebook_category}`,
      '',
      'Description:',
      '',
      listing.description,
      '',
      'Images:',
      '',
      ...listing.all_image_urls.split(' | ').map((url, imageIndex) => `${imageIndex + 1}. ${url}`),
      '',
      '---',
      '',
    );
  }

  return lines.join('\n');
}

async function main() {
  const env = readEnv();
  storeName = env.VITE_STORE_NAME || env.STORE_NAME || storeName;
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from .env');
  }

  const sql = neon(env.DATABASE_URL);
  const products = await sql`
    SELECT id, name, price, original_price, category, status, image_url, extra_images, description, colors, created_date
    FROM products
    WHERE status = 'active'
    ORDER BY created_date DESC
  `;

  const listings = products.map((product) => {
    const typeInfo = detectProductType(product);
    const keywords = keywordsForProduct(product, typeInfo);
    const images = allImages(product);

    return {
      id: product.id,
      title: titleForProduct(product),
      price: Number(product.price || 0),
      currency: 'MAD',
      condition: 'Neuf',
      availability: 'En stock',
      suggested_facebook_category: typeInfo.facebookCategory,
      local_category: product.category || typeInfo.category,
      description: descriptionForProduct(product, keywords),
      keywords: keywords.join(', '),
      main_image_url: images[0] || '',
      extra_image_urls: images.slice(1).join(' | '),
      all_image_urls: images.join(' | '),
    };
  });

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(MARKDOWN_FILE, markdownForListings(listings));
  fs.writeFileSync(CSV_FILE, toCsv(listings));
  fs.writeFileSync(JSON_FILE, JSON.stringify(listings, null, 2));

  console.log(`Generated ${listings.length} listings`);
  console.log(MARKDOWN_FILE);
  console.log(CSV_FILE);
  console.log(JSON_FILE);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
