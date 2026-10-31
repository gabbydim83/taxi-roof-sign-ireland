# Taxi Roof Sign Ireland — V1.5: Display Position fix

This update fixes the catalogue-order input in **Owner Management**. The native dropdown in V1.4 has been replaced with a visible **numeric input**, plus **− / +** and **Move to first / Move to last** buttons. Draft products may choose their intended position before enabling **Show this product**.

## What has changed

- `owner/index.html`: new position field, buttons and clearer helper text.
- `assets/js/owner.js`: numeric position handling, bounds checking, and easy button controls.
- `assets/css/site.css`: desktop/mobile styling for the new position control.

All other website files, product listings and Supabase settings are unchanged.

## Important Supabase requirement

**Do not run any SQL again if you already executed `migration_v1_4.sql`.** V1.5 does not change the database schema. If V1.4 migration was never executed, run `database/migration_v1_4.sql` once before testing position updates.

## Install

1. Back up your local `taxi irland` folder, or create a Git commit before copying.
2. Copy the *contents* of this ZIP into `C:\Users\gabby\Desktop\taxi irland`, replacing matching files but preserving `.git`.
3. In the VS Code PowerShell terminal run:

```powershell
git status
git add owner/index.html assets/js/owner.js assets/css/site.css UPDATE_V1_5.md
git commit -m "Fix owner catalogue position input"
git pull --rebase origin main
git push origin main
```

4. Visit `https://taxiroofsign.gabrieldesign.work/owner/` and press **Ctrl+F5**.
5. Select a product, enter a position (e.g. `1`), then save. For a draft, also check **Show this product in the public catalogue**.
6. Reload the homepage and confirm the product appears in the chosen position.

If saving returns an error referring to `display_order` or `set_product_display_position`, the V1.4 SQL migration has not been applied successfully.
