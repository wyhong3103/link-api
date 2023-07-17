const logger = require('debug')('link-api:post-controller');
const Post = require('../models/post');
const Comment = require('../models/comment');
const mongoose = require('mongoose');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const get_posts = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.userid, {})
        .populate({
            path : "posts",
            populate : [
                {
                    path : 'comments',
                    populate : {
                        path : 'author',
                        select : "_id first_name last_name image"
                    }
                },
                {
                    path : 'author',
                    select : "_id first_name last_name image"
                }
            ]
        })
        .exec();
        
        if (user === null){
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }

        const posts = user.posts;
        
        const friends = await User.find({ _id: { $in: user.friends } })
        .populate({
            path : "posts",
            populate : [
                {
                    path : 'comments',
                    populate : {
                        path : 'author',
                        select : "_id first_name last_name image"
                    }
                },
                {
                    path : 'author',
                    select : "_id first_name last_name image"
                }
            ]
        })
        .exec();

        for(const i of friends){
            posts.push(...i.posts);
        }

        posts.sort((a, b) => a.date - b.date);

        res.json({
            status : true,
            posts
        })
    }
)

const create_post = [
    body("content", "Content length should be within 1 to 30000 characters")
    .trim()
    .isLength({min : 1, max : 30000})
    .escape(),
    body("markdown", "markdown should be a boolean value.")
    .isBoolean(),
    body("math", "math should be a boolean value.")
    .isBoolean(),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Content details did not pass validation`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = await User.findById(req.userid).exec();

            if (user === null){
                res.status(404).json({
                    status : false,
                    error : {result : 'User not found.'}
                });
                return;
            }

            const post = await (new Post({
                author : user._id,
                content : req.body.content,
                markdown : req.body.markdown,
                math : req.body.math,
                date : Date.now(),
            })).save();


            user.posts.push(post._id);
            await user.save();
            await post.save();
            logger('Post is created.');
            logger('Post is added to user.');

            res.json({
                status : true,
                message : "Post is created.",
            });
        }
    )
]


const update_post = [
    body("content", "Content length should be within 1 to 30000 characters")
    .trim()
    .isLength({min : 1, max : 30000})
    .escape(),
    body("markdown", "markdown should be a boolean value.")
    .isBoolean(),
    body("math", "math should be a boolean value.")
    .isBoolean(),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Content details did not pass validation`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = req.user;
            const post = req.post;

            if (req.user._id.toString() !== post.author._id.toString()){
                logger('No permission.')
                res.status(403).json({
                    status : false,
                    error : {result : 'No permission.'}
                });
                return;
            }

            post.content = req.body.content;
            post.markdown = req.body.markdown === 'true';
            post.math = req.body.math === 'true';

            await user.save();
            await post.save();
            logger('Post is updated');

            res.json({
                status : true,
                message : "Post is updated.",
            });
        }
    )
]

const delete_post = asyncHandler(
    async (req, res) => {
        const user = req.user;
        const post = req.post;

        if (post.author._id.toString() !== user._id.toString()){
            logger('No permission.');
            res.status(403).json({
                status : false,
                error : {result : 'No permission.'}
            });
            return;
        }

        await Post.findByIdAndRemove(post._id);
        logger('Post is deleted.');
        res.json({
            status : true,
            message : "Post is deleted."
        });
    }
)


const like_post = asyncHandler(
    async (req, res) => {
        const user = req.user;
        const post = req.post;

        let found = false;
        for(const i of post.likes){
            if (i._id.toString() === user._id.toString()){
                logger('User already liked this post.');
                found = true;
            }
        }

        if (!found){
            logger('Like is sent.');
            post.likes.push(user._id);
        }

        await post.save();

        res.json({
            status : true,
            message : "Like is sent.",
        })
    }
)

const unlike_post = asyncHandler(
    async (req, res) => {
        const user = req.user;
        const post = req.post;

        post.likes = post.likes.filter(i => i._id.toString() !== user._id.toString());
        logger('Like is removed if there is any');

        await post.save();

        res.json({
            status : true,
            message : "Like is retracted.",
        })
    }
)

const comment_post = [
    body("content", "Content length should be within 1 to 8000 characters")
    .trim()
    .isLength({min : 1 , max : 8000})
    .escape(),
    body("markdown")
    .isBoolean(),
    body("math")
    .isBoolean(),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Content details did not pass validation`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = req.user;
            const post = req.post;

            const comment = await (new Comment({
                author : user._id,
                content : req.body.content,
                markdown : req.body.markdown,
                math : req.body.math,
                date : Date.now()
            })).save();

            logger('Comment saved in the database.');
            post.comments.push(comment._id);
            await post.save();
            res.json({
                status : true,
                message : "Comment posted.",
            });
        }
    )
]

const update_comment = [
    body("content", "Content length should be within 1 to 8000 characters")
    .trim()
    .isLength({min : 1 , max : 8000})
    .escape(),
    body("markdown")
    .isBoolean(),
    body("math")
    .isBoolean(),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Content details did not pass validation`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            if (!mongoose.isValidObjectId(req.params.commentid)){
                logger('Comment ID is invalid.');
                res.status(404).json({
                    status : false,
                    error : {result : "Comment not found."}
                })
                return;
            }

            const comment = await Comment.findById(req.params.commentid).exec();

            if (comment === null){
                logger('Comment ID not found.');
                res.status(404).json({
                    status : false,
                    error : {result : "Comment not found."}
                })
                return;
            }
            const user = req.user;
            if (comment.author._id.toString() !== user._id.toString()){
                logger('No permission.');
                res.status(403).json({
                    status : false,
                    error : {result : "No permission."}
                })
                return;
            }

            comment.content = req.body.content;
            comment.markdown = req.body.markdown;
            comment.math = req.body.math;

            logger('Comment updated.');
            await comment.save();
            res.json({
                status : true,
                message : "Comment updated.",
            });
        }
    )
]

const delete_comment = asyncHandler(
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.commentid)){
            logger('Comment ID is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "Comment not found."}
            })
            return;
        }

        const comment = await Comment.findById(req.params.commentid).exec();

        if (comment === null){
            logger('Comment ID not found.');
            res.status(404).json({
                status : false,
                error : {result : "Comment not found."}
            })
            return;
        }

        const user = req.user;
        const post = req.post;
        if (comment.author._id.toString() !== user._id.toString()){
            logger('No permission.');
            res.status(403).json({
                status : false,
                error : {result : "No permission."}
            })
            return;
        }

        post.comments = post.comments.filter(i => i._id.toString() !== comment._id.toString());
        await post.save();
        logger('Comment is removed from post.')
        await Comment.findByIdAndRemove(comment._id).exec();
        logger('Comment is removed.')

        res.json({
            status : true,
            message : "Comment is removed.",
        });
    }
)


module.exports = {
    get_posts,
    create_post,
    update_post,
    delete_post,
    like_post,
    unlike_post,
    comment_post,
    update_comment,
    delete_comment
}