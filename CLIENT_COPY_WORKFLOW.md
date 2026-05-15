# Client Copy Workflow

Use this when creating a new store from the current Devixo codebase.

## Recommended Structure

Keep the original project untouched:

```txt
Devixo_v01
Devixo_client_template
Client_A_Store
Client_B_Store
```

Each client should have:

- Its own project folder
- Its own GitHub repository
- Its own Vercel project
- Its own database
- Its own environment variables
- Its own `SITE_URL` and `VITE_SITE_URL`
- Its own admin login and WhatsApp number

## Create A Copy

From inside `Devixo_v01`, run:

```bash
bash scripts/create-client-copy.sh ../Client_Store_Name
```

The script excludes:

- `.git`
- `.env` and local environment files
- `node_modules`
- `dist`
- `.codex`
- local OS/editor junk

## First Steps In The New Copy

```bash
cd ../Client_Store_Name
npm install
npm run build
```

Then create a new Git repo:

```bash
git init
git add .
git commit -m "Initial client store"
```

Create a fresh `.env` in the new project from `.env.example`. Do not reuse the original Devixo `.env` unless this is intentionally the same store.

## What To Change Per Client

- Store name, logo, favicon
- Brand colors and visual tone
- WhatsApp phone number
- Footer contact details
- Admin login credentials
- Products, categories, specs, colors, badges
- Hero/featured sections
- SEO text and public domain
- `SITE_URL` and `VITE_SITE_URL`
- Database connection

## Deployment

Create a new Vercel project for the copied folder/repo.

Set environment variables:

```txt
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_FOLDER
SITE_URL=https://client-domain.com
VITE_SITE_URL=https://client-domain.com
VITE_STORE_NAME=Client Brand
VITE_STORE_SLUG=client-brand
VITE_STORE_TAGLINE=Boutique tech au Maroc
VITE_STORE_DESCRIPTION=Accessories and products with delivery across Morocco
VITE_WHATSAPP_NUMBER=212600000000
VITE_WHATSAPP_DISPLAY=+212 600 000 000
VITE_SUPPORT_HOURS=7j/7 de 9h à 21h
```

Redeploy after changing environment variables.
