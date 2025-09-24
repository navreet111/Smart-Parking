import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "quickpark",
  password: "navreet20041",
  port: 5432,
});

// ✅ Initialize DB tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        slot_number INT NOT NULL,
        area VARCHAR(100) NOT NULL,
        is_booked BOOLEAN DEFAULT false,
        booked_by INT REFERENCES users(id),
        parking_hours INT,
        booked_by_username VARCHAR(100),
        UNIQUE (slot_number, area)
      );
    `);

    const dummySlotsQuery = `
      INSERT INTO slots (slot_number, area, is_booked, booked_by, booked_by_username) VALUES
      (1, 'Delhi', false, null, null), (2, 'Delhi', false, null, null), (3, 'Delhi', false, null, null),
      (1, 'Mumbai', false, null, null), (2, 'Mumbai', false, null, null), (3, 'Mumbai', false, null, null),
      (1, 'Bengaluru', false, null, null), (2, 'Bengaluru', false, null, null), (3, 'Bengaluru', false, null, null),
      (1, 'Chandigarh', false, null, null), (2, 'Chandigarh', false, null, null), (3, 'Chandigarh', false, null, null)
      ON CONFLICT (slot_number, area) DO NOTHING;
    `;
    await pool.query(dummySlotsQuery);

    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ Error initializing DB:", err);
  }
}

// ================= ROUTES ================= //

// ✅ Register
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashedPassword]
    );
    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    console.error("❌ Error in /register:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, "secretkey", { expiresIn: "1h" });
    res.json({ message: "✅ Login successful", token, userId: user.id });
  } catch (err) {
    console.error("❌ Error in /login:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get slots by area
app.get("/slots/:area", async (req, res) => {
  const { area } = req.params;
  try {
    const result = await pool.query("SELECT * FROM slots WHERE area = $1 ORDER BY slot_number", [area]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in /slots:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Book a slot (JWT Protected)
app.post("/book/:slotId", async (req, res) => {
  const { slotId } = req.params;
  const { parkingHours } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    const userId = decoded.id;

    const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    const username = userResult.rows[0].username;

    const slot = await pool.query("SELECT * FROM slots WHERE id = $1", [slotId]);
    if (slot.rows.length === 0) return res.status(404).json({ error: "Slot not found" });
    if (slot.rows[0].is_booked) return res.status(400).json({ error: "Slot already booked" });

    await pool.query(
      "UPDATE slots SET is_booked = true, booked_by = $1, parking_hours = $2, booked_by_username = $3 WHERE id = $4",
      [userId, parkingHours, username, slotId]
    );

    res.json({ message: "✅ Slot booked successfully" });
  } catch (err) {
    console.error("❌ Error in /book:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Contact form
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  console.log(`📩 Message from ${name} (${email}): ${message}`);
  res.json({ message: "Message received successfully" });
});

// ✅ Start server
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
