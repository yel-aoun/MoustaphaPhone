# Client Store Deployment Checklist

Use this checklist whenever the Vercel domain behaves differently from localhost.

## 1. Environment Variables

Vercel does not read the local `.env` file. Add these in:

Vercel Dashboard -> Project -> Settings -> Environment Variables

```txt
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_FOLDER
SITE_URL
VITE_SITE_URL
VITE_STORE_NAME
VITE_STORE_SLUG
VITE_STORE_TAGLINE
VITE_STORE_DESCRIPTION
VITE_WHATSAPP_NUMBER
VITE_WHATSAPP_DISPLAY
VITE_SUPPORT_HOURS
```

Use client-specific values, not the original store values:

```txt
SITE_URL=https://your-domain.com
VITE_SITE_URL=https://your-domain.com
VITE_STORE_NAME=Customer Brand
VITE_WHATSAPP_NUMBER=212600000000
```

`SITE_URL` is used by the backend. `VITE_SITE_URL` is used by the browser app for customer-facing links in WhatsApp messages. Use your real Vercel/custom domain for both so tracking links are clickable on customer phones.

After changing environment variables, redeploy the project.

## 2. Production Health Check

Open:

```txt
https://your-domain.com/api/health
```

Expected:

```json
{
  "ok": true,
  "checks": {
    "database": {
      "connected": true,
      "products": 33
    }
  }
}
```

If `DATABASE_URL` is missing, Vercel is not configured.

If `products` is `0`, Vercel is connected to a different or empty database.

## 3. Product API Check

Open:

```txt
https://your-domain.com/api/products
```

Expected: a JSON array of products.

Common results:

- `[]`: database works, but that database has no products.
- `{"error":"DATABASE_URL is missing"}`: add `DATABASE_URL` to Vercel.
- `500` or database error: check the Neon connection string and Vercel logs.

## 4. SEO Checks

Open:

```txt
https://your-domain.com/sitemap.xml
https://your-domain.com/robots.txt
```

Product detail pages should appear in the sitemap when the database is connected.

## 5. Admin Checks

Open:

```txt
https://your-domain.com/admin
```

Confirm:

- login works with Vercel `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- products are visible in the Products tab
- image uploads work with Cloudinary variables
- Dashboard analytics loads after visitors interact with the storefront
