/**
 * 3M Trading — Gift Claim Webhook
 *
 * This Apps Script receives POST requests from the gift-claim page
 * (gifts.3mtrading.ca) and appends each claim to a Google Sheet.
 *
 * SETUP (one-time, ~5 minutes):
 *   1. Open https://sheets.google.com  →  create a new sheet,
 *      name it something like "3M Gift Claims".
 *   2. In that sheet:  Extensions  →  Apps Script.
 *   3. Delete the default Code.gs contents, paste THIS file in.
 *   4. Click the disk / save icon.
 *   5. Click "Deploy"  →  "New deployment"  →  gear icon  →
 *      select "Web app".
 *        • Description: "3M claim webhook"
 *        • Execute as:  Me
 *        • Who has access:  Anyone
 *      Click "Deploy", grant permissions when asked.
 *   6. Copy the "Web app URL" it gives you.
 *   7. Paste that URL into claim/index.html, into the constant:
 *           const GOOGLE_SHEETS_WEBHOOK_URL = "..."
 *   8. Commit + redeploy the static site. Done.
 *
 * NOTE: every time you change THIS script, you must re-deploy
 * (Deploy → Manage deployments → pencil icon → New version).
 */

const SHEET_NAME = "Claims";

const HEADERS = [
  "submitted_at",
  "claim_id",
  "status",
  "email",
  "discord",
  "name",
  "gift",
  "region",
  "shipping_price_usd",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
  "country",
  "phone"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();
    const row = HEADERS.map((h) => data[h] === undefined ? "" : data[h]);
    sheet.appendRow(row);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  // Lets you confirm the script is live by visiting the URL in a browser.
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "3M Claim Webhook" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
