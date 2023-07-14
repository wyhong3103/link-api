const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({dest : "uploads/"});

router.post('/', authMiddleware.authorizeUser, upload.single('image'), postController.create_post);
// router.put('/:postid', authMiddleware, postController.update_post);
// router.delete('/:postid', authMiddleware, postController.delete_post);
// router.post('/:postid/like', authMiddleware, postController.like_post);
// router.delete('/:postid/like/', authMiddleware, postController.unlike_post);
// router.post('/:postid/comment', authMiddleware, postController.comment_post);
// router.put('/:postid/comment/:commentid', authMiddleware, postController.update_comment);
// router.delete('/:postid/comment/:commentid', authMiddleware, postController.delete_comment);

module.exports = router;