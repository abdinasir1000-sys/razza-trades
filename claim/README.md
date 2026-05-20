# 3M Gift Claim Site — `gifts.3mtrading.ca`

Static, animated VIP-only gift claim page for the 39 members who filled out the original 3M Free Gift Selection and Shipping Form.

## What it does

1. **Verify** — visitor enters the email + zip code from their original Google Form submission. Checked client-side against an embedded whitelist of 39 entries.
2. **Confirm** — they see their pre-filled gift choice and shipping address. Editable. Shipping-cost acknowledgment required.
3. **Pay shipping** — region-aware (US vs international) price shown, then redirected to your Stripe payment link.
4. **Success** — claim summary + confetti, claim logged to Google Sheet, repeat claims blocked.

## Deploy-now-fill-in-later config

You can deploy this site with **zero** config filled in. Until you add a Stripe link, the page runs in "reserve claim" mode — users finish the flow, the system records their claim, and you DM them the payment link in Discord later. Once you paste the links in, the site automatically switches to self-serve checkout.

Open `claim/index.html` and edit the three config blocks at the top of the `<script>` section as you're ready:

### 1. `GOOGLE_SHEETS_WEBHOOK_URL` *(optional)*
Adds a row to a Google Sheet every time someone reserves or pays. Without it, claims still work — they just aren't logged centrally. Setup steps live in `APPSSCRIPT.gs` (~5 min).

### 2. `PAYMENT_LINKS` *(optional — drives self-serve checkout)*
Two Stripe Payment Links — one for US shipping, one for International. While both are empty, the site asks users to "Reserve My Claim" and tells them you'll DM the payment link.

### 3. `SHIPPING_PRICES_USD` *(optional)*
US flat shipping price, INTL flat shipping price. The gift itself is free; only shipping is charged. While null, the price isn't shown — the customer just sees "Shipping cost confirmed at checkout".

## Deploying to `gifts.3mtrading.ca`

This folder is a fully self-contained static site (one HTML file + this Apps Script reference). To put it on `gifts.3mtrading.ca`:

1. **Cloudflare Pages** (easiest, since the domain is already on Cloudflare):
   - Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
   - Pick this repo.
   - Build command: leave blank.
   - Build output directory: `claim`
   - Deploy. Cloudflare gives you a `*.pages.dev` URL.
   - Pages → your project → Custom domains → add `gifts.3mtrading.ca`. Cloudflare auto-creates the DNS record since the zone is already on Cloudflare.

2. **Alternative — same Vercel project**:
   - The file is already at `/claim/index.html`, so the existing Vercel deployment will serve it at `razzatrades.com/claim`. Then either add `gifts.3mtrading.ca` as a domain alias inside Vercel and route `/` → `/claim` with a rewrite, or stick with the Cloudflare Pages approach above.

## Whitelist data

The 39-entry whitelist is embedded directly in `index.html` (`const WHITELIST = [...]`). If new members need to claim later, paste their row into that array following the same shape.

## Anti-double-claim

A successful claim writes the user's email to `localStorage` under the key `3m_claims`. Re-entering on the same browser shows the "Already Claimed" screen. This is intentionally client-side (good enough for a 39-person VIP list) — the real source of truth is the Google Sheet your webhook writes to.

If you ever need to let someone re-submit on the same browser (testing, fixing a typo, etc.), there's an admin "Start over" button on the already-claimed screen.

## Files

- `index.html` — the entire site, fully self-contained
- `APPSSCRIPT.gs` — paste into Google Apps Script to enable Google Sheet logging
- `README.md` — this file
