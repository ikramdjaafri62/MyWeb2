const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const app = express();

// 🔹 Secret key for signing tokens — set this in your environment, never commit it
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET is not set. Set it in your environment variables.");
}

// middlewares
app.use(cors());
app.use(express.json());

// 🔹 Database connection — uses a pool (serverless-friendly) and reads
// credentials from environment variables instead of being hardcoded.
// On Vercel these come from Project Settings → Environment Variables.
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  // Most hosted MySQL providers (TiDB Serverless, Aiven, PlanetScale, etc.)
  // require TLS. Set DB_SSL=true in your env vars if your provider needs it.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  connectionLimit: 5,
  waitForConnections: true,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Connected to MySQL database");
    connection.release();
  }
});

// 🔹 Middleware to verify the token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// 🔹 Middleware to check if the user is an admin
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

// 🔒 PROTECTED: Only authenticated admins can add places
app.post("/add-place", requireAuth, requireAdmin, (req, res) => {
  const { name, description, latitude, longitude, type } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing data" });
  }

  const sql = `
    INSERT INTO places (name, description, latitude, longitude, type)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [name, description, latitude, longitude, type], (err, result) => {
    if (err) {
      console.log("❌ Insert error:", err);
      return res.status(500).json(err);
    }

    res.json({
      message: "✅ Place added successfully",
      id: result.insertId,
    });
  });
});

app.get("/places", (req, res) => {
  const sql = "SELECT * FROM places";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("❌ Fetch error:", err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM users
    WHERE username = ? AND password = ?
  `;

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      const user = result[0];

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const { password: userPass, ...safeUser } = user;

      res.json({
        success: true,
        user: safeUser,
        token: token,
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

// 🔹 Local-dev convenience only. On Vercel, files in /public are served
// directly by the CDN and this line is never reached for those paths.
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Only start a listening server when run directly (e.g. `node server.js`
// or `npm start` locally). On Vercel, the app is imported and invoked as
// a serverless function instead, so this block is skipped.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
