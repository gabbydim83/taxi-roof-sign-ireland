# Taxi Roof Sign Ireland — V1.3 update

## What changed

- A confirmed new product: **Complete Taxi Roof Sign with Magnets**, **€185**, using its supplied WebP photograph.
- Five additional uploaded photographs are stored as **draft** product records. Drafts are not visible to public visitors until the owner enters a product name and enables publication.
- **Owner Management** now edits Product Name, Short Description, Price (€), Collect, Delivery, and Public visibility for every product.
- The six existing products and their already-saved Supabase prices remain unchanged.
- On public pages, updated names and prices are fetched from Supabase; WhatsApp messages use the current product name.
- All products remain in one catalogue; no separate Parts category.
- The first confirmed new product has a standalone page at `products/complete-taxi-roof-sign-with-magnets/`.

## Required setup: FIRST run the migration SQL

Your existing database currently has six product IDs and cannot accept the new records until the constraint is updated.

1. Open the existing **taxi-roof-sign-ireland** project in Supabase.
2. Go to **SQL Editor > New**.
3. Paste the **entire contents** of `database/migration_v1_3.sql` and select **Run**.
4. Verify that the final result lists **12 rows** (`new01` through `new06`, plus the six original product IDs).
5. Confirm `new01` has `price_eur = 185` and `is_published = true`; `new02`–`new06` have `price_eur = NULL` and `is_published = false`.

Do not run the initial database/schema.sql again; V1.3 is an **incremental migration**.

## Update GitHub Pages website

Extract this zip and copy its contents into the existing local repository folder (`C:\Users\gabby\Desktop\taxi irland`), preserving the `assets`, `owner`, and `products` folder structure and replacing the existing files.

In the VS Code terminal (within the repo folder), run:

```powershell
git status
git add .
git commit -m "Add new taxi products and editable product names"
git push origin main
```

GitHub Pages will deploy the new static files after the push. No DNS changes are needed.

## How the owner edits products

1. Open `/owner/` on your published site and sign in.
2. Choose any product from the dropdown.
3. Modify **Product Name**, **Short Description**, and **Price (€)**. An empty Price shows "On request" to buyers.
4. Set **Show this product in the public catalogue** on or off.
5. Save. Refresh the homepage to see the changes.

For the five unconfirmed products, the owner should enter the real commercial name first; only then check the publication box. Their photo, path and internal ID are already configured. Product slugs remain stable when names change; this avoids broken links.

## Important notes

- The website remains `noindex` during testing. Product names changed dynamically in the browser do **not** automatically update the underlying static HTML, which should be refreshed when final titles are settled for SEO.
- The Supabase publishable key in `assets/js/config.js` is intended to be public. Never publish password, service role or secret keys.
- Live Supabase cannot be accessed from this build environment. The SQL migration and live owner login/save need validation in your browser.
- The owner panel requires existing authorized Supabase Authentication user and RLS policies.
- Confirm WhatsApp number before final launch, and verify all regulatory product claims.
