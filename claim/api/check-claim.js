module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  const whopUserId = req.query.whop_user_id;
  if (!whopUserId) return res.status(400).json({ error: "Missing whop_user_id" });

  try {
    const url = `${supabaseUrl}/rest/v1/claims?whop_user_id=eq.${encodeURIComponent(whopUserId)}&select=claim_id,gift,created_at&limit=1`;
    const resp = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!resp.ok) {
      console.error("Supabase check failed:", resp.status);
      return res.status(500).json({ error: "Check failed" });
    }

    const rows = await resp.json();
    if (rows.length > 0) {
      return res.json({ claimed: true, claim: rows[0] });
    }
    return res.json({ claimed: false });
  } catch (err) {
    console.error("check-claim error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
