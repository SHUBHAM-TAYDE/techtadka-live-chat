const { pool }  = require('../config/db');
const logger    = require('../config/logger');

/**
 * All Socket.io events live here.
 * Called once from index.js after the io server is created.
 *
 * Events (client → server):
 *   join_room       { roomId }
 *   leave_room      { roomId }
 *   send_message    { roomId, content }
 *   typing_start    { roomId }
 *   typing_stop     { roomId }
 *
 * Events (server → client):
 *   message_received  { message }
 *   room_joined       { roomId, members }
 *   user_joined       { user }
 *   user_left         { userId }
 *   online_users      { users }
 *   user_typing       { userId, username, roomId }
 *   user_stop_typing  { userId, roomId }
 *   error             { message }
 */
const registerSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    const user = socket.user;
    logger.info('Socket connected', { socketId: socket.id, userId: user.id, username: user.username });

    // Mark user online
    await setOnlineStatus(user.id, true);
    io.emit('online_users', await getOnlineUsers());

    // ─── Join Room ───────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      try {
        if (!roomId) return;

        // Verify room exists
        const { rows: roomRows } = await pool.query(
          'SELECT id, name FROM rooms WHERE id = $1 AND is_private = FALSE',
          [roomId]
        );
        if (!roomRows.length) {
          return socket.emit('error', { message: 'Room not found' });
        }

        // Record membership
        await pool.query(
          'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [roomId, user.id]
        );

        socket.join(roomId);

        // Fetch current online members in this room
        const { rows: members } = await pool.query(`
          SELECT u.id, u.username, u.avatar_url, u.is_online
          FROM room_members rm
          JOIN users u ON u.id = rm.user_id
          WHERE rm.room_id = $1
        `, [roomId]);

        socket.emit('room_joined', { roomId, members });

        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          user: { id: user.id, username: user.username, avatar_url: user.avatar_url },
          roomId,
        });

        logger.debug('User joined room', { userId: user.id, roomId });
      } catch (err) {
        logger.error('join_room error', { error: err.message });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── Leave Room ──────────────────────────────────────────────────────────
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', { userId: user.id, roomId });
      logger.debug('User left room', { userId: user.id, roomId });
    });

    // ─── Send Message ────────────────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, content }) => {
      try {
        if (!roomId || !content || !content.trim()) return;

        const trimmed = content.trim().slice(0, 4000);

        const { rows } = await pool.query(
          `INSERT INTO messages (room_id, user_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [roomId, user.id, trimmed]
        );

        const message = {
          ...rows[0],
          sender: {
            id:         user.id,
            username:   user.username,
            avatar_url: user.avatar_url,
          },
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit('message_received', { message });

        logger.debug('Message sent', { messageId: message.id, roomId, userId: user.id });
      } catch (err) {
        logger.error('send_message error', { error: err.message });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing Indicators ───────────────────────────────────────────────────
    socket.on('typing_start', ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('user_typing', {
        userId:   user.id,
        username: user.username,
        roomId,
      });
    });

    socket.on('typing_stop', ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('user_stop_typing', { userId: user.id, roomId });
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId: user.id, reason });

      await setOnlineStatus(user.id, false);
      io.emit('online_users', await getOnlineUsers());

      // Tell all rooms this user was in
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          io.to(roomId).emit('user_left', { userId: user.id, roomId });
        }
      });
    });
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const setOnlineStatus = async (userId, isOnline) => {
  await pool.query(
    'UPDATE users SET is_online = $1, last_seen = NOW() WHERE id = $2',
    [isOnline, userId]
  );
};

const getOnlineUsers = async () => {
  const { rows } = await pool.query(
    'SELECT id, username, avatar_url FROM users WHERE is_online = TRUE'
  );
  return rows;
};

module.exports = { registerSocketHandlers };
