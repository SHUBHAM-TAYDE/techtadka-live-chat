const express = require('express');
const { getRooms, getRoom, createRoom, getRoomMembers } = require('../controllers/roomController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// All room routes are protected
router.use(authMiddleware);

// GET  /api/rooms
router.get('/', getRooms);

// GET  /api/rooms/:id
router.get('/:id', getRoom);

// POST /api/rooms
router.post('/', createRoom);

// GET  /api/rooms/:id/members
router.get('/:id/members', getRoomMembers);

module.exports = router;
