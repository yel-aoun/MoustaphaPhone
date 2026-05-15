# Client Store Backend Setup

This storefront no longer uses Supabase directly from the browser.

The app now uses:

- Neon/Postgres for `products`, `categories`, and `orders`
- Cloudinary for product image uploads
- `/api/*` server routes for all database, upload, and admin-auth work
- `/api/health` for production diagnostics

## Required environment variables

Copy `.env.example` to `.env` locally, and add the same variables in Vercel:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
ADMIN_SESSION_SECRET="use-a-long-random-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_FOLDER="client-products"
SITE_URL="https://your-domain.com"
VITE_SITE_URL="https://your-domain.com"
VITE_STORE_NAME="Customer Brand"
VITE_STORE_SLUG="customer-brand"
VITE_STORE_TAGLINE="Boutique tech au Maroc"
VITE_STORE_DESCRIPTION="Accessoires, périphériques et produits tech avec livraison partout au Maroc."
VITE_WHATSAPP_NUMBER="212600000000"
VITE_WHATSAPP_DISPLAY="+212 600 000 000"
VITE_SUPPORT_HOURS="7j/7 de 9h à 21h"
```

## Database schema

The API creates the schema automatically on first request.

If you prefer to create it manually, run `database-schema.sql` in the Neon SQL editor.

## Local development

Run:

```bash
npm run dev
```

The Vite dev server includes a small middleware that serves the `/api/*` routes locally.

## Admin login

The `/admin` page uses `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

Product/category/order write actions require the admin token issued by `/api/auth`.

## Production diagnostics

After deploying to Vercel, open:

```bash
https://YOUR_DOMAIN/api/health
```

This checks required environment variables, database connectivity, and product/category/order counts without exposing secrets.

If local products do not appear on Vercel, compare:

```bash
https://YOUR_DOMAIN/api/products
```

with the local database count. The most common cause is that Vercel has no `DATABASE_URL`, or it points to a different Neon database than `.env`.
