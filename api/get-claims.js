module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.CLAIM_API_KEY || req.query.key !== process.env.CLAIM_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/claims?order=created_at.asc&select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Supabase fetch failed:", resp.status, txt);
      return res.status(500).json({ error: "Failed to fetch claims" });
    }

    const rows = await resp.json();
    const cols = [
      "id","claim_id","submitted_at","email","name","discord","gift",
      "address1","address2","city","state","zip","country","phone",
      "whop_user_id","created_at"
    ];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      cols.join(","),
      ...rows.map(r => cols.map(c => escape(r[c])).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="3m-claims.csv"');
    return res.send(csv);
  } catch (err) {
    console.error("get-claims error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
