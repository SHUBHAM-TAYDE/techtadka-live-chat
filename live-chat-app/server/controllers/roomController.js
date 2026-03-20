const { pool } = require('../config/db');
const logger   = require('../config/logger');

// ─── List all public rooms ────────────────────────────────────────────────────
const getRooms = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.created_at,
        COUNT(DISTINCT rm.user_id)::int AS member_count
      FROM rooms r
      LEFT JOIN room_members rm ON rm.room_id = r.id
      WHERE r.is_private = FALSE
      GROUP BY r.id
      ORDER BY r.name ASC
    `);

    return res.status(200).json({ success: true, rooms: rows });
  } catch (err) {
    logger.error('getRooms error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
};

// ─── Get a single room ────────────────────────────────────────────────────────
const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT id, name, description, created_at FROM rooms WHERE id = $1 AND is_private = FALSE',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json({ success: true, room: rows[0] });
  } catch (err) {
    logger.error('getRoom error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
};

// ─── Create a room ────────────────────────────────────────────────────────────
const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Room name must be at least 2 characters' });
    }

    const safeName = name.trim().toLowerCase().replace(/\s+/g, '-');

    // Check uniqueness
    const existing = await pool.query('SELECT id FROM rooms WHERE name = $1', [safeName]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'A room with this name already exists' });
    }

    const { rows } = await pool.query(
      `INSERT INTO rooms (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_at`,
      [safeName, description || null, req.user.id]
    );

    const room = rows[0];

    // Auto-join creator
    await pool.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [room.id, req.user.id]
    );

    logger.info('Room created', { roomId: room.id, name: room.name, createdBy: req.user.id });

    return res.status(201).json({ success: true, room });
  } catch (err) {
    logger.error('createRoom error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to create room' });
  }
};

// ─── Get online members of a room ─────────────────────────────────────────────
const getRoomMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.avatar_url, u.is_online, u.last_seen
      FROM room_members rm
      JOIN users u ON u.id = rm.user_id
      WHERE rm.room_id = $1
      ORDER BY u.is_online DESC, u.username ASC
    `, [id]);

    return res.status(200).json({ success: true, members: rows });
  } catch (err) {
    logger.error('getRoomMembers error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

module.exports = { getRooms, getRoom, createRoom, getRoomMembers };
