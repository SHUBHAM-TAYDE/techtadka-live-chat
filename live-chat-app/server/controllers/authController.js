const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');
const logger = require('../config/logger');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be 3–30 characters' });
    }

    // Check for duplicates
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'Email or username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username.toLowerCase(), email.toLowerCase(), passwordHash]
    );

    const user  = rows[0];
    const token = signToken(user.id);

    logger.info('User registered', { userId: user.id, username: user.username });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    logger.error('Register error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, email, password, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user.id);

    logger.info('User logged in', { userId: user.id });

    return res.status(200).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url },
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ─── Get current user ────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

// ─── Helper ──────────────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

module.exports = { register, login, getMe };
