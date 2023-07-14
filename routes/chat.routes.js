const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/:roomid', authMiddleware.authorizeUser, chatController.get_chat);

module.exports = router;