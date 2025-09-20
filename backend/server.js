// server.js
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
    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);

    // 2. Create slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        slot_number INT NOT NULL,
        area VARCHAR(100) NOT NULL,
        is_booked BOOLEAN DEFAULT false,
        booked_by INT REFERENCES users(id),
        UNIQUE (slot_number, area)
      );
    `);

    // 3. ALTER TABLE to add the new columns with commas
    await pool.query(`
      ALTER TABLE slots
      ADD COLUMN IF NOT EXISTS parking_hours INT,
      ADD COLUMN IF NOT EXISTS booked_by_username VARCHAR(100);
    `);

    // 4. Insert updated dummy slots for testing
    const dummySlotsQuery = `
      INSERT INTO slots (slot_number, area, is_booked, booked_by, booked_by_username) VALUES
      (1, 'Delhi', false, null, null), (2, 'Delhi', true, 1, 'user1'), (3, 'Delhi', false, null, null), (4, 'Delhi', true, 1, 'user1'), (5, 'Delhi', false, null, null),
      (6, 'Delhi', false, null, null), (7, 'Delhi', true, 1, 'user1'), (8, 'Delhi', false, null, null), (9, 'Delhi', true, 1, 'user1'), (10, 'Delhi', false, null, null),

      (1, 'Mumbai', true, 1, 'user1'), (2, 'Mumbai', false, null, null), (3, 'Mumbai', false, null, null), (4, 'Mumbai', false, null, null), (5, 'Mumbai', true, 1, 'user1'),
      (6, 'Mumbai', false, null, null), (7, 'Mumbai', false, null, null), (8, 'Mumbai', true, 1, 'user1'), (9, 'Mumbai', false, null, null), (10, 'Mumbai', false, null, null),

      (1, 'Bengaluru', false, null, null), (2, 'Bengaluru', true, 1, 'user1'), (3, 'Bengaluru', false, null, null), (4, 'Bengaluru', true, 1, 'user1'), (5, 'Bengaluru', false, null, null),
      (6, 'Bengaluru', false, null, null), (7, 'Bengaluru', true, 1, 'user1'), (8, 'Bengaluru', false, null, null), (9, 'Bengaluru', true, 1, 'user1'), (10, 'Bengaluru', false, null, null),

      (1, 'Chandigarh', true, 1, 'user1'), (2, 'Chandigarh', false, null, null), (3, 'Chandigarh', true, 1, 'user1'), (4, 'Chandigarh', false, null, null), (5, 'Chandigarh', false, null, null),
      (6, 'Chandigarh', true, 1, 'user1'), (7, 'Chandigarh', false, null, null), (8, 'Chandigarh', true, 1, 'user1'), (9, 'Chandigarh', false, null, null), (10, 'Chandigarh', false, null, null)
      ON CONFLICT (slot_number, area) DO NOTHING;
    `;
    await pool.query(dummySlotsQuery);

    console.log("✅ Database initialized with updated slots and schema");
  } catch (err) {
    console.error("❌ Error initializing DB:", err);
  }
}

// ================= ROUTES ================= //

// ✅ Register route
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

// ✅ Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "secretkey",
      { expiresIn: "1h" }
    );
    res.json({ message: "✅ Login successful", token, userId: user.id });
  } catch (err) {
    console.error("❌ Error in /login:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get all slots for a specific area
app.get("/slots/:area", async (req, res) => {
  const { area } = req.params;
  try {
    // 👈 NO JOIN needed, as the username is in the slots table
    const result = await pool.query(
      "SELECT * FROM slots WHERE area = $1 ORDER BY slot_number",
      [area]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in /slots:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Book a slot
app.post("/book/:slotId", async (req, res) => {
  const { slotId } = req.params;
  const { userId, parkingHours } = req.body; 

  try {
    const slot = await pool.query(
      "SELECT * FROM slots WHERE id = $1",
      [slotId]
    );
    if (slot.rows.length === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }
    if (slot.rows[0].is_booked) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    // 👈 Get the username of the user who is booking
    const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    const username = userResult.rows[0].username;

    // 👈 Update the query to save the userId and username
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

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    console.log(`Received contact message from ${name} (${email}): ${message}`);
    res.json({ message: "Message received successfully" });
  } catch (err) {
    console.error("Error in /contact:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Server start
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});