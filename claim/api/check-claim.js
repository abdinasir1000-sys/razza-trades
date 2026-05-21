module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("check-claim: missing env vars", { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey });
    return res.status(500).json({ error: "Server misconfigured", detail: "missing_env" });
  }

  const whopUserId = req.query.whop_user_id;
  if (!whopUserId || typeof whopUserId !== "string" || whopUserId.trim().length === 0) {
    return res.status(400).json({ error: "Missing whop_user_id" });
  }

  try {
    const url = `${supabaseUrl}/rest/v1/claims?whop_user_id=eq.${encodeURIComponent(whopUserId)}&select=claim_id&limit=1`;
    const resp = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Supabase check failed:", resp.status, txt);
      return res.status(500).json({ error: "Check failed", detail: resp.status, body: txt.slice(0, 200) });
    }

    const rows = await resp.json();
    return res.json({ claimed: rows.length > 0 });
  } catch (err) {
    console.error("check-claim error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};
