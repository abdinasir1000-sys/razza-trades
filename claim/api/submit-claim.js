module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Server misconfigured" });

  const body = req.body || {};
  const { access_token } = body;

  if (!access_token || typeof access_token !== "string") {
    return res.status(401).json({ error: "Missing access_token" });
  }

  try {
    // Verify token with Whop and extract authoritative identity
    const userinfoResp = await fetch("https://api.whop.com/oauth/userinfo", {
      headers: { "Authorization": `Bearer ${access_token}` }
    });

    if (!userinfoResp.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userinfo = await userinfoResp.json();
    const verifiedSub = userinfo && userinfo.sub;
    const verifiedEmail = userinfo && userinfo.email;
    if (!verifiedSub) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Cap helper
    const cap = (v, n) => (typeof v === "string" ? v.slice(0, n) : v);

    // Validate required client-supplied fields
    const required = ["name", "gift", "address1", "city", "country", "phone"];
    for (const field of required) {
      const v = body[field];
      if (typeof v !== "string" || v.trim().length === 0) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Build sanitized record (all strings capped at 500 chars defensively)
    const record = {
      claim_id:     cap(typeof body.claim_id === "string" ? body.claim_id : "", 200),
      submitted_at: cap(typeof body.submitted_at === "string" ? body.submitted_at : "", 200),
      email:        cap(typeof verifiedEmail === "string" ? verifiedEmail : "", 500),
      name:         cap(body.name, 500),
      discord:      cap(typeof body.discord === "string" ? body.discord : "", 500),
      gift:         cap(body.gift, 500),
      address1:     cap(body.address1, 500),
      address2:     cap(typeof body.address2 === "string" ? body.address2 : "", 500),
      city:         cap(body.city, 500),
      state:        cap(typeof body.state === "string" ? body.state : "", 500),
      zip:          cap(typeof body.zip === "string" ? body.zip : "", 500),
      country:      cap(body.country, 500),
      phone:        cap(body.phone, 500),
      whop_user_id: cap(verifiedSub, 500)
    };

    // Duplicate pre-check uses the VERIFIED sub
    const checkUrl = `${supabaseUrl}/rest/v1/claims?whop_user_id=eq.${encodeURIComponent(verifiedSub)}&select=claim_id&limit=1`;
    const checkResp = await fetch(checkUrl, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!checkResp.ok) {
      const errTxt = await checkResp.text();
      console.error("Supabase check failed:", checkResp.status, errTxt);
      // Table likely doesn't exist — surface the error clearly
      let msg = errTxt;
      try { msg = JSON.parse(errTxt).message || errTxt; } catch (_) {}
      return res.status(500).json({ ok: false, supabase_error: msg.slice(0, 300) });
    }
    const existing = await checkResp.json();
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: "already_claimed" });
    }

    const resp = await fetch(`${supabaseUrl}/rest/v1/claims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(record)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Supabase insert failed:", resp.status, txt);
      if (resp.status === 409) {
        return res.status(409).json({ ok: false, error: "already_claimed" });
      }
      // Return supabase error detail so the browser console shows exactly what failed
      let detail = txt;
      try { detail = JSON.parse(txt).message || txt; } catch (_) {}
      return res.status(500).json({ ok: false, supabase_error: detail.slice(0, 300) });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("submit-claim error:", err);
    return res.status(500).json({ ok: false });
  }
};
