# 3M Gift Claim Site — `gifts.3mtrading.ca`

Static, animated VIP-only gift claim page for the 39 members who filled out the original 3M Free Gift Selection and Shipping Form.

## What it does

1. **Verify** — visitor enters the email + zip code from their original Google Form submission. Checked client-side against an embedded whitelist of 39 entries.
2. **Confirm** — they see their pre-filled gift choice and shipping address. Editable. Shipping-cost acknowledgment required.
3. **Pay shipping** — region-aware (US vs international) price shown, then redirected to your Stripe payment link.
4. **Success** — claim summary + confetti, claim logged to Google Sheet, repeat claims blocked.

## Three things to fill in before going live

Open `claim/index.html` and edit the three config blocks at the top of the `<script>` section:

### 1. `GOOGLE_SHEETS_WEBHOOK_URL`
Follow the setup steps inside `APPSSCRIPT.gs`. You'll deploy a Google Apps Script as a web app, then paste the resulting URL into this constant.

### 2. `PAYMENT_LINKS`
Create 6 Stripe Payment Links (https://dashboard.stripe.com/payment-links) — one per region/gift combo:

| | Coffee Mug | Sticker Packet | Phone Case |
|---|---|---|---|
| US | $X | $Y | $Z |
| International | $X | $Y | $Z |

Paste each URL into the matching slot. While slots are empty, the site shows a friendly "payment link being finalized" message instead of a broken button — so it's safe to deploy in stages.

### 3. `SHIPPING_PRICES_USD`
Update the displayed price for each gift / region. Keep these in sync with what the customer will actually be charged on the Stripe page.

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
