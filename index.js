const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Check if user exists
app.get("/check-user", async (req, res) => {
  const { userEmail } = req.query;
  try {
    const result = await db.query(
      "SELECT 1 FROM messages WHERE useremail = $1 LIMIT 1",
      [userEmail]
    );
    return res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all messages for a user
app.get("/messages", async (req, res) => {
  const userEmail = req.query.userEmail;
  if (!userEmail) return res.status(400).json({ error: "userEmail is required" });

  try {
    const result = await db.query("SELECT * FROM messages WHERE useremail = $1", [userEmail]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Add a message
app.post("/messages", async (req, res) => {
  const { userEmail, text } = req.body;
  if (!userEmail || !text) return res.status(400).json({ error: "userEmail and message text required" });

  try {
    const result = await db.query(
      "INSERT INTO messages (userEmail, message) VALUES ($1, $2) RETURNING *",
      [userEmail, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add message" });
  }
});

// Delete one message
app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM messages WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
