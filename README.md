# Taxi Roof Sign Ireland — Website V1.2 (Supabase connected)

Updated website prototype for **six Irish taxi roofsign products**, using all eight supplied photographs (two hero/background scenes and six catalogue images), plus the location and parcel icons.

## What is included

- `index.html`: responsive commercial homepage, catalogue, how ordering works, reseller CTA, contact/footer. The three statistics/features beneath the Hero were removed as requested; the homepage now continues directly to **Find the right fit.**
- `products/<slug>/index.html`: six separate, SEO-friendly static product-detail URLs.
- `owner/index.html`: Owner Management Panel with per-product Price (€), Collect, Delivery and extra toggles for Refurbished Taxi Roofsign.
- `privacy/index.html` and `terms/index.html`: **draft** legal/informational pages, requiring business review.
- `assets/images/`: compressed WebP versions of your supplied images.
- `assets/js/config.js`: phone, WhatsApp, and optional Supabase settings.
- `database/schema.sql`: Supabase product table, owner authorization list, and Row Level Security policies.

## Quick preview

Extract the folder and start a local server from its root:

```bash
python -m http.server 8000
```

Open **http://localhost:8000/**. Click any product. Open **http://localhost:8000/owner/** to change demo prices/collection/delivery. Reload the homepage/product page to see the changes.

In the old unconfigured prototype, **Owner Management was DEMO ONLY on localhost / file preview**. Data saves to `localStorage` on that same browser and computer. It is **not shared online**, **not authenticated**, and **not safe to use in production**. Nothing here pretends that a real admin database is already connected.

## Supabase connection is configured in V1.2

`assets/js/config.js` now points to the customer's Supabase project, and uses the browser-safe `sb_publishable_...` key. Product prices, Collect, Delivery and refurbished sign options load from `product_settings`. The owner can sign in via Supabase Auth and save changes if present in `admin_users`.

**Use an HTTP preview server, not `file://`** for the live integration test. A browser connection to Supabase is required. LocalStorage demo prices from V1.1 no longer appear while this configuration is active.

Please follow **OWNER_SETUP.md** for the safe login/save/other-browser test. Live authentication has *not* been verified by the builder's environment, which cannot resolve the customer's Supabase host.

## Product-specific functionality

| # | Product | Buyer inputs in the details page |
|---|---|---|
| 1 | Refurbished Taxi Roofsign | Owner-controlled LED toggle, cable toggle, 2/3/4/5m, plug type, English/Irish availability; buyer chooses visible text language where applicable. |
| 2 | Taxi Roofsign G&S 900 | Standard/Hold, Roofsign Number, Wheelchair Stickers Yes/No, Roofsign Text English/Irish. |
| 3 | Taxi Roofsign Northern Ireland | No buyer options, just Call and Book Now. |
| 4 | Taxi Roofsign With Suction Cups G&S 900 | Roofsign Text English/Irish and Wheelchair Stickers Yes/No. |
| 5 | Taxi Roofsign 1 | No buyer options, just Call and Book Now. |
| 6 | Taxi Roofsign 2 | No buyer options, just Call and Book Now. |

`Book Now` opens WhatsApp with the product's exact name and, if applicable, all buyer-selected options. `Call` opens `tel:+353873927955`. Reseller CTA uses a separate prefilled WhatsApp enquiry. **There is no automatic payment, stock reservation or confirmed order.**

## Important checks before launching

- **Updated image required for product 2:** the image included is the previous uploaded file, whose artwork says **GNS 900**, not the corrected **G&S 900**. Replace `assets/images/product-gs-900.webp` with the owner's corrected asset before publishing. (The product name in the HTML already uses `G&S`.)
- **Product 3 compliance:** verify the claim “Meets all approved specifications for Northern Ireland” for the actual product and applicable NI taxi class before publishing. NI specifications vary by vehicle class. Do not treat this preview as independent regulatory certification.
- **Product 4 compatibility:** confirm Tesla/glass/aluminium/non-magnetic roof suitability and installation instructions with the seller. Some vehicles need model-specific checks.
- **Product 1:** LED, cable and language are disabled in the initial demo until the owner explicitly selects them. No unconfirmed included accessories are asserted.
- **Price / fulfilment:** product cards display “On request”, and detail cards say “Ask us…” until owner-provided information is saved. No invented prices or addresses.
- **Legal / identity:** owner must provide business legal name, business contact address, email, VAT position, warranty/returns policy, cookie/analytics setup and fulfilment terms. Privacy and Order Information are draft pages, not legal approval.
- **SEO:** pages currently contain `<meta name="robots" content="noindex,nofollow">` to prevent indexing unfinished content. Remove it at launch, add absolute self-canonical URLs with the purchased domain, supply final copy, generate sitemap and Search Console registration. Product pages already use regular `<a href>` links and unique titles/descriptions. Review Google Product schema and offer data after real prices and backend are confirmed. Do not publish site duplicates on multiple domains.
- **Domain:** not required for local development. Hosting/domain link can be configured later.

## Suggested next version

1. Verify the business details and final product photos/short descriptions.
2. Connect Supabase and test the owner login on a deployment preview.
3. Review mobile responsiveness, real-world WhatsApp delivery, accessibility and current legal requirements with the owner.
4. Connect the purchased domain(s), update SEO canonical and indexation, and launch.

**Windows shortcut:** If Python is installed, double-click `Start_Preview_Windows.bat` and keep its terminal window open while reviewing. Otherwise, upload the extracted folder to your preferred static hosting preview.
