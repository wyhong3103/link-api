const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const postMiddleware = require('../middlewares/post.middleware');
const multer = require('multer');
const upload = multer({dest : "uploads/"});

/*
    Get posts from friends and self

*/
router.get('/', authMiddleware.authorizeUser, postController.get_posts);

router.post('/', authMiddleware.authorizeUser, upload.single('image'), postController.create_post);

router.put('/:postid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.update_post);

router.delete('/:postid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.delete_post);
// router.post('/:postid/like', authMiddleware.authorizeUser, postController.like_post);
// router.delete('/:postid/like/', authMiddleware.authorizeUser, postController.unlike_post);
// router.post('/:postid/comment', authMiddleware.authorizeUser, postController.comment_post);
// router.put('/:postid/comment/:commentid', authMiddleware.authorizeUser, postController.update_comment);
// router.delete('/:postid/comment/:commentid', authMiddleware.authorizeUser, postController.delete_comment);

module.exports = router;