const express = require('express');
const { getMessages }    = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/rooms/:roomId/messages?before=<msgId>&limit=50
router.get('/:roomId/messages', getMessages);

module.exports = router;
