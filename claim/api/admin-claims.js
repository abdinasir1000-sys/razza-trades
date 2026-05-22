module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.CLAIM_API_KEY || req.query.key !== process.env.CLAIM_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/claims?order=created_at.desc&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch claims" });
    const rows = await resp.json();
    return res.json({ ok: true, claims: rows });
  } catch (err) {
    console.error("admin-claims error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
