# Taxi Roof Sign Ireland V1.2 — Supabase Owner Management

## Current state

The website is now configured to use the **taxi-roof-sign-ireland** Supabase project:
- Project URL: `https://drqyxoevmrqkczlmyypi.supabase.co`
- Public frontend key: set in `assets/js/config.js` (`sb_publishable_...`)
- The six `product_settings` rows were created through SQL Editor (the user's result displayed `products_created = 6`).
- One Auth user was added to `public.admin_users` (the user's result displayed `approved_admins = 1`).

The package does **not** contain the owner's password or any server-side secret key.

## What to do now — test on your computer

1. Extract the ZIP fully. Launch `Start_Preview_Windows.bat` (requires Python) or run `python -m http.server 8000` from the extracted folder. Do **not** open `index.html` using `file://` for the live test.
2. Check that you are online: the browser must be able to reach both `supabase.co` and the ESM library hosted by `cdn.jsdelivr.net`.
3. Open `http://localhost:8000/owner/`.
4. Sign in with the **email and password of the user created in Supabase Authentication > Users**. This is **not** your Supabase dashboard account unless you separately created it as a website Auth user. **Never share the password** in chat.
5. Choose `Refurbished Taxi Roofsign`. Enter a test price, e.g. `199.00`, and optionally collection/delivery details. Click **Save Product Changes**. You should see `Saved to the live database...`.
6. Open `http://localhost:8000/` in another browser or private window. Confirm the new price appears on the first card. Click into the product details page and confirm it matches.
7. Sign out of `/owner/` and verify editing disappears. Sign back in and verify the price remains. Optionally re-test the catalogue on a second device once hosted.

**Note:** old local demo prices from V1.1 are intentionally ignored now. Prices must be entered and saved to the live project again. The first six rows have blank price, collection, and delivery defaults.

## Security checklist before making the site public

- In the Supabase Dashboard, under **Authentication > Sign In / Providers > Email** (interface wording can change), disable **new public signups** for this project while leaving email/password sign-in enabled. The owner user already exists.
- In **Database > Policies**, confirm `admin_users` and `product_settings` have **RLS enabled** and the policies applied from `database/schema.sql` (`public reads products`, `approved owner updates products`, and `admin reads own membership`). Your last SQL run already installed policies; do not run a conflicting older version again.
- Do not send the database password, an Auth user password, `sb_secret_...`, or `service_role` credentials to anyone.
- The project settings allow anyone to see the **public catalogue data** (including all six current prices), but only a user in `admin_users` can **update**. This is intentional.
- Use HTTPS for public hosting. Add your hosted URL to Authentication > URL Configuration if using auth features with redirects later.
- Verify the merchant's WhatsApp number separately. The site's current WhatsApp configuration tentatively uses the same number as Phone Order (+353 87 392 7955).
- Legal pages are drafts and `noindex,nofollow` remains set during development. Do not remove this until content and regulatory claims have been checked.

## If it doesn't connect

- If login says **Invalid login credentials**, check the email/password in Supabase Authentication (not the Supabase dashboard login). You may reset the Auth user password in the dashboard; do not send it to the developer.
- If login says **This account has not been granted owner-management access**, ensure the Auth user's UID matches the row in `public.admin_users` (the `approved_admins = 1` count alone does not prove the intended UID is selected).
- If you see **Failed to fetch**, check browser internet access, the console's Network tab, and whether a VPN/ad blocker blocks `cdn.jsdelivr.net` or your Supabase project URL.
- If **Save** is denied with a permissions/RLS error, review table grants/policies and confirm the signed-in email belongs to the authorized user.
- If catalogue prices show **On request**, verify the remote product prices in **Table Editor > product_settings** or try refreshing after a successful save.

## Limitations of this environment

The package was validated locally but the builder environment could not reach the user's live Supabase host. A real remote authentication + write + read test must be completed in the user's browser. Until then, we cannot claim the live backend has been end-to-end verified.
