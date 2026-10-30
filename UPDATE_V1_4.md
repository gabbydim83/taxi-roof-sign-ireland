# Taxi Roof Sign Ireland — V1.4: Display Position

This update adds a **Display Position in Catalogue** selector to Owner Management, without changing the visual design or existing product detail pages. Products in the public collection are reordered by the `display_order` field read from Supabase.

## IMPORTANT — do this FIRST in Supabase

1. Open your existing `taxi-roof-sign-ireland` project in Supabase → SQL Editor → New.
2. Paste and execute **`database/migration_v1_4.sql`**. Run **V1.4 only**, not the initial schema or V1.3 migration again.
3. The results should show **12 rows** with `display_order` values. Existing prices, names and published/draft flags are preserved.

The migration adds `display_order` and the protected `set_product_display_position` RPC. The RPC checks your approved owner account and atomically moves an item to its desired position; the other published products shift to accommodate it. Drafts are not included in public position counting.

## Update website files

Copy the **contents** of this V1.4 ZIP into your existing local `C:\Users\gabby\Desktop\taxi irland` directory (overwrite matching files). Do **not** delete the folder; retain `.git` and its connection to GitHub.

From VS Code terminal:

```powershell
git status
git add .
git commit -m "Add editable catalogue product positions"
git pull --rebase origin main
git push origin main
```

If `git pull --rebase` reports CONFLICT, stop and resolve the conflict before trying to push. Never use `--force`.

## How to use

1. Sign in at `https://taxiroofsign.gabrieldesign.work/owner/`.
2. Choose a product from the dropdown.
3. Select **Display Position in Catalogue** (e.g. **1 — First product**).
4. Press **Save Product Changes**.
5. Refresh homepage (Ctrl+F5); the product appears at the chosen position, shifting the others down.

For a draft: enter its name, check **Show this product in the public catalogue**, choose its position, and save. If a product remains hidden, the position selector is disabled.

**Note:** public products remain individually linked to the same stable URLs. Position does not change a page URL, saved price, photo or WhatsApp message. The order is loaded from Supabase, so all visitors see the same order after refreshing.

## Scope of validation

Syntax and local-file integrity can be checked in this build environment. A live Supabase RPC call requires your authorized signed-in browser session; do this final test after uploading V1.4.
