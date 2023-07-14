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
    body("delete_image", "delete_image should be a boolean value.")
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
                image : ""
            })).save();


            req.body.delete_image = req.body.delete_image === 'true';

            // If detect file and delete image is not checked
            if (!req.body.delete_image && req.file){
                if (req.file.mimetype.startsWith('image/')) {
                    const result = fileService.transferImage(req.file, post._id, logger);

                    if (result.status){
                        user.image = result.path;
                    }else{
                        res.json(400).json({
                            status : false,
                            error : {result : 'Something went wrong.'}
                        })
                        return;
                    }
                }else{
                    logger('Uploaded file has an unsupported mimetype');
                    res.json(400).json({
                        status : false,
                        error : {result : 'Unsupported file type.'}
                    })
                    return;
                }
            }

            if (req.body.delete_image){
                logger('Attempting to delete upload image.');
                if (req.file && !fileService.deleteImage(req.file.path, logger)){
                    res.json(400).json({
                        status : false,
                        error : {result : 'Something went wrong.'}
                    })
                    return;
                }
                user.image = "";
            }

            user.posts.push(post._id);
            await user.save();
            await post.save();
            logger('Post is created.');
            logger('Post is added to user.');

            res.json({
                status : true,
                message : "Post is created."
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
    body("delete_image", "delete_image should be a boolean value.")
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

            if (!mongoose.isValidObjectId(req.params.postid)){
                logger('Post id is invalid.');
                res.status(404).json({
                    status : false,
                    error : {result : "Post not found."}
                })
            }

            const user = await User.findById(req.userid).exec();

            if (user === null){
                logger('User not found.');
                res.status(404).json({
                    status : false,
                    error : {result : 'User not found.'}
                });
                return;
            }

            const post = await Post.findById(req.params.postid).exec();

            if (post === null){
                logger('Post not found.');
                res.status(404).json({
                    status : false,
                    error : {result : 'Post not found.'}
                });
                return;
            }

            if (user._id.toString() !== post.author._id.toString()){
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


            req.body.delete_image = req.body.delete_image === 'true';

            // If detect file and delete image is not checked
            if (!req.body.delete_image && req.file){
                if (req.file.mimetype.startsWith('image/')) {
                    const result = fileService.transferImage(req.file, post._id, logger);

                    if (result.status){
                        user.image = result.path;
                    }else{
                        res.json(400).json({
                            status : false,
                            error : {result : 'Something went wrong.'}
                        })
                        return;
                    }
                }else{
                    logger('Uploaded file has an unsupported mimetype');
                    res.json(400).json({
                        status : false,
                        error : {result : 'Unsupported file type.'}
                    })
                    return;
                }
            }

            if (req.body.delete_image){
                logger('Attempting to delete upload image.');
                if (req.file && !fileService.deleteImage(req.file.path, logger)){
                    res.json(400).json({
                        status : false,
                        error : {result : 'Something went wrong.'}
                    })
                    return;
                }
                user.image = "";
            }

            await user.save();
            await post.save();
            logger('Post is updated');

            res.json({
                status : true,
                message : "Post is updated."
            });
        }
    )
]

const delete_post = asyncHandler(
    async (req, res) => {
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

/*



const like_post = {}

const unlike_post = {}

const commen_post = {}

const update_comment = {}

const delete_comment = {}
*/


module.exports = {
    get_posts,
    create_post,
    update_post,
    delete_post
}