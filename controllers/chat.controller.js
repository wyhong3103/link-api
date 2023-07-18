const logger = require('debug')('link-api:chat-controller');
const mongoose = require('mongoose');
const Chat = require('../models/chat');
const Message = require('../models/message');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const chatService = require('../services/chat.service');

const get_chats = asyncHandler(
    async (req, res) => {
        const chat = await Chat.find({ users : { $elemMatch: { $eq: req.userid } } })
        .populate({
            path : "messages",
            select : 'date'
        })
        .populate({
            path : "users",
            select : "_id first_name last_name image"
        })
        .exec();

        if (chat === null){
            logger('Users have no chat record.');
            res.json({
                status : true,
                chats : []
            })
            return;
        }

        const ret = [];

        for(const i of chats){
            if (!i.messages.length) continue;
            ret.push({
                user : (i.users[0]._id.toString() === req.userid ? i.users[1] : i.users[0]),
                date : i.messages[i.messages.length - 1].date
            })
        }

        ret.sort((a, b) => b.date - a.date);

        logger('User chats are returned.');

        res.json({
            status : true,
            chats : ret
        })
    }
)

const get_chat = asyncHandler(
    async (req, res) => {
        const users = req.params.roomid.split(',');

        if (users.length !== 2){
            logger('Room ID provided is invalid.');
            res.status(404).json({
                status :false,
                error : {result : "Room not found."}
            });
            return;
        }

        if (!mongoose.isValidObjectId(users[0]) || !mongoose.isValidObjectId(users[1])){
            logger('User ID provided is invalid.');
            res.status(404).json({
                status :false,
                error : {result : "Room not found."}
            });
            return;
        }        
        
        if (req.userid !== users[0] && req.userid !== users[1]){ 
            logger('No permission.');
            res.status(403).json({
                status :false,
                error : {result : "No permission."}
            });
            return;
        }

        const user1 = await User.findById(users[0]).exec();
        const user2 = await User.findById(users[1]).exec();

        if (user1 === null || user2 === null){ 
            logger('User not found.');
            res.status(404).json({
                status :false,
                error : {result : "User not found."}
            });
            return;
        }

        const chat = await Chat.findOne({room : chatService.getRoomID(users[0], users[1])})
        .populate({
            path : "messages",
            populate : {
                path : 'author',
                select : "_id first_name last_name image"
            }
        })
        .exec();

        if (chat === null){
            logger('Users have no chat record.');
            res.json({
                status : true,
                user : (user1._id.toString() === req.userid ? user2 : user1),
                messages : []
            })
            return;
        }
        logger('Users chat is returned.');
        res.json({
            status : true,
            user : (user1._id.toString() === req.userid ? user2 : user1),
            messages : chat.messages
        })

    }
)

module.exports = {
    get_chats,
    get_chat
}