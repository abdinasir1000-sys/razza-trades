module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.json({
      step: "env_vars",
      ok: false,
      error: "SUPABASE_URL or SUPABASE_SECRET_KEY is not set in Vercel environment variables"
    });
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/claims?select=claim_id&limit=1`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const text = await resp.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { parsed = text; }

    return res.json({
      step: "supabase_query",
      ok: resp.ok,
      status: resp.status,
      response: parsed
    });
  } catch (err) {
    return res.json({
      step: "supabase_query",
      ok: false,
      error: err.message
    });
  }
};
