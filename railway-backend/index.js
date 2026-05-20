const express = require("express");
const { Pool }  = require("pg");
const cors      = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS claims (
      id           SERIAL PRIMARY KEY,
      claim_id     TEXT,
      submitted_at TEXT,
      email        TEXT,
      name         TEXT,
      discord      TEXT,
      gift         TEXT,
      address1     TEXT,
      address2     TEXT,
      city         TEXT,
      state        TEXT,
      zip          TEXT,
      country      TEXT,
      phone        TEXT,
      whop_user_id TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// Health check
app.get("/", (_req, res) => res.json({ ok: true, service: "3M Claim API" }));

// Receive a claim from the gift site
app.post("/claim", async (req, res) => {
  try {
    const {
      claim_id, submitted_at, email, name, discord, gift,
      address1, address2, city, state, zip, country, phone, whop_user_id
    } = req.body;

    await pool.query(
      `INSERT INTO claims
         (claim_id, submitted_at, email, name, discord, gift,
          address1, address2, city, state, zip, country, phone, whop_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [claim_id, submitted_at, email, name, discord, gift,
       address1, address2, city, state, zip, country, phone, whop_user_id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /claim error:", err);
    res.status(500).json({ ok: false });
  }
});

// Download all claims as CSV — protected by CLAIM_API_KEY
app.get("/claims", async (req, res) => {
  if (!process.env.CLAIM_API_KEY || req.query.key !== process.env.CLAIM_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM claims ORDER BY created_at ASC"
    );

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
    res.send(csv);
  } catch (err) {
    console.error("GET /claims error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`3M Claim API on port ${PORT}`)))
  .catch(err => { console.error("DB init failed:", err); process.exit(1); });
