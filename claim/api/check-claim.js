module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  const accessToken = req.query.access_token;
  if (!accessToken || typeof accessToken !== "string") {
    return res.status(400).json({ error: "Missing access_token" });
  }

  try {
    // Verify token with Whop and get authoritative sub
    const userinfoResp = await fetch("https://api.whop.com/oauth/userinfo", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!userinfoResp.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userinfo = await userinfoResp.json();
    const verifiedSub = userinfo && userinfo.sub;
    if (!verifiedSub) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const url = `${supabaseUrl}/rest/v1/claims?whop_user_id=eq.${encodeURIComponent(verifiedSub)}&select=claim_id&limit=1`;
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
    return res.json({ claimed: rows.length > 0 });
  } catch (err) {
    console.error("check-claim error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
