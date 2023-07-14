const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const postMiddleware = require('../middlewares/post.middleware');
const multer = require('multer');
const upload = multer({dest : "uploads/"});

/*

Get posts from friends and self

Output : {
    posts : [
        {
            author : {_id, first_name, last_name, image} 
            content, 
            markdown, 
            math,
            date, 
            comments : 
            [ 
                {
                    _id, 
                    content, 
                    author : {_id, first_name, last_name, image} 
                    markdown,
                    math,
                    date
                } 
            ],
            likes : [Users],
        }
    ]
}

*/

router.get('/', authMiddleware.authorizeUser, postController.get_posts);


/*

Create post

If delete image is true, it will delete the existing image & upload image (if there is any)

else it is going to check whether there is an image attached, and replace it with the original

Input : {
    content, markdown, math, delete_image
}

*/

router.post('/', authMiddleware.authorizeUser, upload.single('image'), postController.create_post);

/*

Update Post

delete image works the same as posting

Input : {
    content, markdown, math, delete_image
}

*/

router.put('/:postid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.update_post);

/*

Delete post

*/
router.delete('/:postid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.delete_post);

/*

Like post

(if liked before, will also be OK)

*/
router.post('/:postid/like', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.like_post);

/*

Unlike post

(if unliked before, will also be OK)

*/
router.delete('/:postid/like', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.unlike_post);

/*

Post comment

Input : {
    content, markdown, math
}

*/
router.post('/:postid/comment', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.comment_post);

/*

Update comment

Input : {
    content, markdown, math
}

*/
router.put('/:postid/comment/:commentid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.update_comment);

/*

Delete Comment

*/
router.delete('/:postid/comment/:commentid', authMiddleware.authorizeUser, postMiddleware.verifyUserAndPost, postController.delete_comment);

module.exports = router;