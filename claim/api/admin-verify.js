module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ADMIN_EMAIL = "3mfx.inquiries@gmail.com";
  const { access_token } = req.body || {};
  if (!access_token) return res.status(401).json({ error: "Missing token" });

  // Verify token and get email from Whop
  const userinfoResp = await fetch("https://api.whop.com/oauth/userinfo", {
    headers: { "Authorization": `Bearer ${access_token}` }
  });
  if (!userinfoResp.ok) return res.status(401).json({ error: "Invalid token" });

  const userinfo = await userinfoResp.json();
  const email = userinfo && userinfo.email;

  if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: "Access denied" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/claims?order=created_at.desc&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch claims" });
    const claims = await resp.json();
    return res.json({ ok: true, claims });
  } catch (err) {
    console.error("admin-verify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
