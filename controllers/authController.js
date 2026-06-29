const db = require("../model/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_time_tracker";

// Helper to hash passwords using PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// Helper to verify passwords
function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields (username, email, password) are required." });
    }

    if (username.trim().length < 3 || username.length > 50) {
      return res.status(400).json({ message: "Username must be between 3 and 50 characters." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Check if user already exists
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE username = ? OR email = ?",
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Username or Email already registered." });
    }

    // Hash password & insert
    const passwordHash = hashPassword(password);
    const [result] = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Fetch user by email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user.user_id);

    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
}

module.exports = {
  register,
  login,
};
