const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB
    const { rows } = await pool.query(
      'SELECT id, username, email, avatar_url FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── Socket.io auth middleware ────────────────────────────────────────────────
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('AUTH_REQUIRED'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, username, avatar_url FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length) return next(new Error('USER_NOT_FOUND'));

    socket.user = rows[0];
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
};

module.exports = { authMiddleware, socketAuthMiddleware };
