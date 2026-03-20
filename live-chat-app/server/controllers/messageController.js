const { pool } = require('../config/db');
const logger   = require('../config/logger');

const PAGE_SIZE = 50;

// ─── Get message history for a room (cursor-based pagination) ─────────────────
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, limit } = req.query;

    const take = Math.min(parseInt(limit, 10) || PAGE_SIZE, 100);

    let query, values;

    if (before) {
      // Fetch messages older than the given message id (for infinite scroll)
      query = `
        SELECT
          m.id,
          m.content,
          m.created_at,
          m.updated_at,
          m.is_deleted,
          json_build_object(
            'id',         u.id,
            'username',   u.username,
            'avatar_url', u.avatar_url
          ) AS sender
        FROM messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.room_id = $1
          AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
        ORDER BY m.created_at DESC
        LIMIT $3
      `;
      values = [roomId, before, take];
    } else {
      query = `
        SELECT
          m.id,
          m.content,
          m.created_at,
          m.updated_at,
          m.is_deleted,
          json_build_object(
            'id',         u.id,
            'username',   u.username,
            'avatar_url', u.avatar_url
          ) AS sender
        FROM messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      values = [roomId, take];
    }

    const { rows } = await pool.query(query, values);

    // Return in chronological order for the client
    const messages = rows.reverse();

    return res.status(200).json({
      success: true,
      messages,
      hasMore: rows.length === take,
    });
  } catch (err) {
    logger.error('getMessages error', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

module.exports = { getMessages };
