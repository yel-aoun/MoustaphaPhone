# Moustapha Phone storefront

Preserve the existing navy identity, light product surfaces, Inter typography, and
French customer-facing copy. The store supports light and dark themes. Central
color tokens live in `src/index.css`; Tailwind maps them in `tailwind.config.js`.

## Color roles

- `primary`: navy in light mode, accessible blue in dark mode. Use for navigation,
  links, product status labels such as Nouveau, and savings text.
- `promotion` / `promotion-foreground`: navy `hsl(211 70% 26%)` and white in both
  themes. Use for the top offer strip; keep it dismissible.
- `deal` / `deal-foreground`: warm accent reserved for actual discounts. Light mode
  uses `hsl(14 80% 39%)` with white; dark mode uses `hsl(18 90% 65%)` with dark text.
- `background`, `foreground`, `secondary`, `muted-foreground`, `border`: use the
  existing theme tokens for surfaces and ordinary content. Product photo wells
  intentionally remain light in dark mode; their text must remain dark enough.
- Keep the supplied logo and its purple mark. WhatsApp retains its service color.
  Do not introduce isolated hard-coded campaign colors.

## Typography

Use Inter throughout with the existing system fallbacks. Use loaded weights only:
400 for body, 500 for labels/product names, 600 for section headings and prices,
and 700 for the brand and main display emphasis. Do not add another font family.

Body text is 16px; compact supporting text is at least 12px. Product names are
14px on mobile and 16px on larger screens; current prices are 16px/18px with
semibold weight and tabular numerals. Section headings use the shared
`section-title` class (24px/32px). Headings balance across lines. Keep the original
price quieter and crossed out, and the current price visually dominant.

## Categories and motion

Use two columns on mobile, three on tablet, and four on desktop, even when only
one category exists. Cards are 270px/320px tall; a compact title area leaves
roughly two-thirds or more of the card for the uncropped product image. Category
icons sit beside the heading on larger screens; mobile prioritizes title space.

Preview up to four distinct images from available products at 3.5-second intervals
with a 500ms crossfade. Pause for hover, focus, explicit pause, hidden tabs, and
off-screen cards. Respect reduced motion by displaying a static image. The link
always opens the full category, independent of the current preview image.

## Offers and navigation

Use `getProductOffer` in `src/lib/products.js` for consistent rounded percentages
and savings. Show the percentage once as a compact badge on the product image;
show the original price and exact MAD savings beneath the current price. Suppress
promotional badges/savings messaging on unavailable items. The top strip advertises
only available discounted products and disappears when there are no offers.

The floating header hides while scrolling down after the top of the page and
returns on upward scrolling, keyboard focus, or opening navigation/search. Keep
focused header controls visible. Reserve scroll clearance for the header and offer
strip. Purchase, wishlist, and color-choice targets are at least 44px square.

Check mobile widths, long French category names, light/dark contrast, reduced
motion, keyboard access, and real product photography before publishing changes.
