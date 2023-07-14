const logger = require('debug')('link-api:post-middleware');
const Post = require('../models/post');
const mongoose = require('mongoose');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');

const verifyUserAndPost = asyncHandler(
    async (req, res, next) => {
        if (!mongoose.isValidObjectId(req.params.postid)){
            logger('Post id is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "Post not found."}
            })
        }

        const user = await User.findById(req.userid).exec();

        if (user === null){
            logger('User not found');
            res.status(404).json({
                status : false,
                error : {result : 'User not found.'}
            });
            return;
        }

        const post = await Post.findById(req.params.postid).exec();

        if (post === null){
            logger('Post not found');
            res.status(404).json({
                status : false,
                error : {result : 'Post not found.'}
            });
            return;
        }
        req.user = user;
        req.post = post;
        next();
    }
)

module.exports = {
    verifyUserAndPost
}