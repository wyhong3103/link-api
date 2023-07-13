const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userMiddleware = require('../middlewares/user.middleware');

const multer = require('multer');
const upload = multer({dest : "uploads/"});

router.get('/', userMiddleware.authorizeUser, userController.get_users);

router.get('/:userid', userMiddleware.authorizeUser, userController.get_user);

router.post('/:userid/friend-request', userMiddleware.authorizeUser, userController.send_friend_request);

router.post('/:userid/friend-request/:friendid', userMiddleware.authorizeUser, userController.manage_friend_request);

router.put('/:userid/password', userMiddleware.authorizeUser, userController.change_password);

router.put('/:userid', userMiddleware.authorizeUser, upload.single('image') ,userController.update_user_info);

module.exports = router;