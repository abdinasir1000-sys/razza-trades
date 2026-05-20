module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  const {
    claim_id, submitted_at, email, name, discord, gift,
    address1, address2, city, state, zip, country, phone, whop_user_id
  } = req.body || {};

  if (!whop_user_id) return res.status(400).json({ error: "Missing whop_user_id" });

  try {
    const checkUrl = `${supabaseUrl}/rest/v1/claims?whop_user_id=eq.${encodeURIComponent(whop_user_id)}&select=claim_id&limit=1`;
    const checkResp = await fetch(checkUrl, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (checkResp.ok) {
      const existing = await checkResp.json();
      if (existing.length > 0) {
        return res.status(409).json({ ok: false, error: "already_claimed" });
      }
    }

    const resp = await fetch(`${supabaseUrl}/rest/v1/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        claim_id, submitted_at, email, name, discord, gift,
        address1, address2, city, state, zip, country, phone, whop_user_id
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Supabase insert failed:", resp.status, txt);
      if (resp.status === 409) {
        return res.status(409).json({ ok: false, error: "already_claimed" });
      }
      return res.status(500).json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("submit-claim error:", err);
    return res.status(500).json({ ok: false });
  }
};
