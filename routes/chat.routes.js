const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/*

Get messages of user 1 and user 2

Output {
    messages : [Message]
}

*/
router.get('/', authMiddleware.authorizeUser, chatController.get_chats);
router.get('/:roomid', authMiddleware.authorizeUser, chatController.get_chat);

module.exports = router;