module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  const {
    claim_id, submitted_at, email, name, discord, gift,
    address1, address2, city, state, zip, country, phone, whop_user_id
  } = req.body || {};

  try {
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
      return res.status(500).json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("submit-claim error:", err);
    return res.status(500).json({ ok: false });
  }
};
