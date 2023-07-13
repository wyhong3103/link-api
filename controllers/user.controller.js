const logger = require('debug')('link-api:user-controller');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const get_users = asyncHandler(
    async (req, res) => {
        const users = await User.find({}, {_id : 1, first_name : 1, last_name : 1, image : 1}).exec();
        res.json({
            users
        });
    }
)

const get_user = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.params.userid, {}, {email : 0, password : 0, friend_requests : 0})
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
            res.status(404).json({
                status : false,
                error : [{result : "User not found."}]
            })
        }

        res.json({
            user
        });
    }
)

// const send_friend_request = 

// const manage_friend_request = 

// const change_password = 

// const update_user = 