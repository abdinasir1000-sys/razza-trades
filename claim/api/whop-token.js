module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, code_verifier, redirect_uri } = req.body || {};
  if (!code || !code_verifier || !redirect_uri) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const clientId     = process.env.WHOP_CLIENT_ID;
  const clientSecret = process.env.WHOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // Whop's modern token endpoint requires JSON body, NOT form-encoded
  const whopResp = await fetch("https://api.whop.com/oauth/token", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:    "authorization_code",
      code,
      redirect_uri,
      client_id:     clientId,
      client_secret: clientSecret,
      code_verifier
    })
  });

  const data = await whopResp.json();
  return res.status(whopResp.status).json(data);
};
