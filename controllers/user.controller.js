const logger = require('debug')('link-api:user-controller');
const fs = require('fs');
const Token = require('../models/token');
const User = require('../models/user');
const Post = require('../models/post');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const authService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');

const get_users = asyncHandler(
    async (req, res) => {
        const users = await User.find({}, {_id : 1, first_name : 1, last_name : 1, image : 1}).exec();
        logger('User list is returned to client.');
        res.json({
            users
        });
    }
)

const get_user = asyncHandler(
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.userid)){
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
        }

        const user = await User.findById(req.params.userid, {})
        .select(`-email -password ${req.params.userid !== req.userid ? '-friend_requests' : ''}`)
        .populate({
            path : "posts",
            populate : {
                path : 'comments',
                populate : {
                    path : 'author',
                    select : "_id first_name last_name image"
                }
            }
        })
        .populate({
            path : "friends",
            select : "_id first_name last_name image"
        })
        .exec();

        if (user === null){
            logger('Requested user does not exist.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }
        logger('User information is returned to client.');

        res.json({
            user
        });
    }
)

const send_friend_request = asyncHandler(
    async (req, res) => {
        if (req.params.userid === req.userid){
            logger('Cannot send friend request to self.');
            res.status(400).json({
                status : false,
                error : {result : "You cannot send yourself a friend request."}
            })
            return;
        }

        if (!mongoose.isValidObjectId(req.params.userid)){
            res.status(404).json({
                status : false,
                error : {result : "Target user not found."}
            })
        }

        const user = await User.findById(req.userid).exec();

        if (user === null){
            logger('User not found.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }

        for(const i of user.friend_requests){
            if (i._id.toString() === req.params.userid){
                res.status(400).json({
                    status : false,
                    error : { result : "There is an existing friend request by user."}
                })
                return;
            }
        }

        const target = await User.findById(req.params.userid).exec();

        if (target === null){
            logger('User not found.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }

        for(const i of target.friends){
            if (i._id.toString() === req.userid){
                logger('User is already friend.');
                res.status(400).json({
                    status : false,
                    error : {result : "User is already friend."}
                })
                return;
            }
        }

        for(const i of target.friend_requests){
            if (i._id.toString() === req.userid){
                res.json({
                    status : true,
                    message : "Friend request sent."
                })
                return;
            }
        }

        target.friend_requests.push(req.userid);

        await target.save();
        logger('Friend request sent.');
        res.json({
            status : true,
            message : "Friend request sent."
        })
        return;

    }
)

const manage_friend_request = asyncHandler(
    async (req, res) => {
        if (req.userid !== req.params.userid){
            res.status(403).json({
                status : false,
                error : {result : "Not allowed."}
            })
        }

        if (!mongoose.isValidObjectId(req.params.friendid)){
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
        }

        const friend = await User.findById(req.params.friendid).exec();

        if (friend === null){
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
        }

        const user = await User.findById(req.userid).exec();

        for(const i of user.friends){
            if (i._id.toString() === req.params.friendid){
                logger('Users are already friend.');
                res.json({
                    status : true,
                    message : "User area already friend."
                })
                return;
            }
        }

        let found = false;
        for(const i of user.friend_requests){
            if (i._id.toString() === req.params.friendid){
                found = true;
            }
        }

        if (!found){
            logger('Request not found.');
            res.status(404).json({
                status : false,
                error : {result : "Not found."}
            })
            return;
        }

        user.friend_requests = user.friend_requests.filter(i => i._id.toString() !== req.params.friendid);
        user.friends.push(req.params.friendid);
        friend.friends.push(req.userid);

        await user.save();
        await friend.save();

        logger(`${req.params.friendid} and ${req.userid} have become friend.`);

        res.json({
            status : true,
            message : "Accepted."
        })
    }
)

const delete_friend_request = asyncHandler(
    async (req, res) => {
        if (req.userid !== req.params.friendid && req.userid !== req.params.userid){
            res.status(403).json({
                status : false,
                error : {result : 'No permission.'}
            })
            return;
        }

       if (!mongoose.isValidObjectId(req.params.userid)){
            logger('User ID is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }
        if (!mongoose.isValidObjectId(req.params.friendid)){
            logger('Friend ID is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
            return;
        }

        const user = await User.findById(req.params.userid).exec();

        if (user === null){
            logger('User not found.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }

        let found = false;
        for(const i of user.friend_requests){
            if (i._id.toString() === req.params.friendid) {
                found = true;
            }
        }
        
        if (!found){
            logger('Friend request not found.');
            res.status(404).json({
                status : false,
                error : {result : "Friend request not found."}
            })
            return;
        }

        user.friend_requests = user.friend_requests.filter(i => i._id.toString() !== req.params.friendid);
        logger('Remove friend request from user.');
        await user.save();
        res.json({
            status : true,
            message : "Friend request is removed."
        });
    }
)


const delete_friend = asyncHandler(
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.userid)){
            logger('User ID is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }
        if (!mongoose.isValidObjectId(req.params.friendid)){
            logger('Friend ID is invalid.');
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
            return;
        }
        const user = await User.findById(req.params.userid).exec();
        const friend = await User.findById(req.params.friendid).exec();

        if (user === null){
            logger('User ID not found.');
            res.status(404).json({
                status : false,
                error : {result : "User not found."}
            })
            return;
        }

        if (friend === null){
            logger('Friend ID not found.');
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
            return;
        }

        let found = false;
        for(const i of user.friends){
            if (i._id.toString() === req.params.friendid){
                found = true;
            }
        }
        if (!found){
            logger('Friend is not found.');
            res.status(404).json({
                status : false,
                error : {result : "Friend not found."}
            })
            return;
        }

        user.friends = user.friends.filter(i => i._id.toString() !== req.params.friendid);
        friend.friends = friend.friends.filter(i => i._id.toString() !== req.params.userid);
        await user.save();
        await friend.save();
        logger('Friend is removed from the list.');

        res.json({
            status : true,
            message : "Friend is removed."
        });
    }
)

const change_password = [
    body('old_password')
    .notEmpty()
    .withMessage("Old password cannot be empty."),
    body('new_password')
    .isLength({min : 8, max : 128})
    .withMessage("Old password cannot be empty."),
    body('new_repassword')
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage("Confirmation password does not match."),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Password details did not pass the validation.`)
                res.status(400).json({
                     status : false,
                     error: errorMessages 
                });
                return;
            }

            const user = await User.findById(req.userid).exec();

            if (user === null){
                logger('User not found.');
                res.status(404).json({
                    status : false,
                    error : {result : 'User not found.'}
                })
                return;
            }

            if (!authService.verifyPassword(req.body.old_password, user.password)){
                logger('Old password does not match.');
                res.status(403).json({
                    status : false,
                    error : {result : 'Old password does not match.'}
                })
                return;
            }

            user.password = authService.hashPassword(req.body.new_password);
            await user.save();
            logger('Password changed.');

            await Token.deleteMany({user : req.userid});
            logger('All old tokens associated with user is destroyed.');

            res.json({
                status : true,
                message : "Password changed."
            });
        }
    )
]

const update_user_info = [
    body('first_name')
    .trim()
    .isLength({min : 1, max :  50})
    .withMessage('First name must be within 1 to 50 characters')
    .escape(),
    body('last_name')
    .trim()
    .isLength({min : 1, max :  50})
    .withMessage('Last name must be within 1 to 50 characters')
    .escape(),
    asyncHandler(
        async (req, res) => {
            
            const user = await User.findById(req.userid).exec();

            if (user === null){
                logger('User not found.');
                res.status(404).json({
                    status : false,
                    error : {result : 'User not found.'}
                })
                return;
            }

            // If detect file
            if (req.file){
                if (req.file.mimetype.startsWith('image/')) {
                    logger('Uploaded file is an image');
                    const file = req.file;
                    const newFileName = user._id + '.' + file.originalname.match(/\.(\w+)$/)[1];
                    const newPath = `${file.destination}${newFileName}`;
                    // Rename the file
                    fs.renameSync(file.path, newPath);

                    // Replace with the actual destination file path
                    const destinationPath = 'public/images/' + newFileName; 

                    let hasError = false;
                    fs.rename(newPath, destinationPath, (err) => {
                        if (err) {
                            logger(`Error moving file - ${err}`);
                            hasError = true;
                            res.status(400).json({
                                status : false,
                                error : {result : 'Something went wrong'}
                            })
                            return;
                        }
                    });

                    if (hasError) return;

                    user.image = true;
                }else{
                    user.image = false;
                    logger('Uploaded file has an unsupported mimetype');
                    res.json(400).json({
                        status : false,
                        error : {result : 'Unsupported file type.'}
                    })
                    return;
                }
            }

            user.first_name = req.body.first_name;
            user.last_name = req.body.last_name;
            await user.save();
            logger('User information is updated.');

            res.json({
                status : true,
                message : "User information is updated."
            });
        }
    )
]

module.exports = {
    get_users,
    get_user,
    send_friend_request,
    manage_friend_request,
    delete_friend_request,
    delete_friend,
    change_password,
    update_user_info
}