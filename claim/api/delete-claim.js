module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ADMIN_EMAIL = "3mfx.inquiries@gmail.com";
  const { access_token, claim_id } = req.body || {};
  if (!access_token || !claim_id) return res.status(400).json({ error: "Missing fields" });

  // Verify Whop token — same check as admin-verify
  const userinfoResp = await fetch("https://api.whop.com/oauth/userinfo", {
    headers: { "Authorization": `Bearer ${access_token}` }
  });
  if (!userinfoResp.ok) return res.status(401).json({ error: "Invalid token" });

  const userinfo = await userinfoResp.json();
  if (!userinfo?.email || userinfo.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: "Access denied" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/claims?claim_id=eq.${encodeURIComponent(claim_id)}`,
      {
        method: "DELETE",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        }
      }
    );
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Supabase delete failed:", resp.status, txt);
      return res.status(500).json({ error: "Delete failed" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("delete-claim error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
