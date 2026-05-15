const PRODUCT_COLUMNS = [
  'id',
  'name',
  'price',
  'original_price',
  'category',
  'status',
  'image_url',
  'extra_images',
  'description',
  'colors',
  'specs',
  'badges',
];

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function productsToCsv(products) {
  const rows = [
    PRODUCT_COLUMNS.join(','),
    ...products.map((product) =>
      PRODUCT_COLUMNS.map((column) => {
        if (column === 'extra_images') return escapeCsv((product.extra_images || []).join('|'));
        return escapeCsv(product[column]);
      }).join(',')
    ),
  ];
  return rows.join('\n');
}

export function productsToMarketplaceCsv(products) {
  const columns = ['title', 'price', 'category', 'description', 'main_image_url', 'extra_image_urls'];
  const rows = [
    columns.join(','),
    ...products.map((product) => [
      product.name,
      product.price,
      product.category,
      product.description,
      product.image_url,
      (product.extra_images || []).join(' | '),
    ].map(escapeCsv).join(',')),
  ];
  return rows.join('\n');
}

export function downloadTextFile(filename, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);

  const [headers = [], ...records] = rows;
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? '']))
  );
}

export function csvRowToProduct(row) {
  const extraImages = String(row.extra_images || '')
    .split('|')
    .map((url) => url.trim())
    .filter(Boolean);

  let colors = [];
  let specs = [];
  let badges = [];
  try {
    colors = row.colors ? JSON.parse(row.colors) : [];
  } catch {
    colors = [];
  }
  try {
    specs = row.specs ? JSON.parse(row.specs) : [];
  } catch {
    specs = [];
  }
  try {
    badges = row.badges ? JSON.parse(row.badges) : [];
  } catch {
    badges = String(row.badges || '')
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return {
    id: row.id?.trim(),
    name: row.name?.trim(),
    price: Number(row.price || 0),
    original_price: row.original_price ? Number(row.original_price) : null,
    category: row.category?.trim(),
    status: row.status?.trim() || 'active',
    image_url: row.image_url?.trim() || '',
    extra_images: extraImages,
    description: row.description || '',
    colors: Array.isArray(colors) ? colors : [],
    specs: Array.isArray(specs) ? specs : [],
    badges: Array.isArray(badges) ? badges : [],
  };
}
