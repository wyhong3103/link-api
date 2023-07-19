const logger = require('debug')('link-api:chat-service');
const Message = require('../models/message');
const Chat = require('../models/chat');
const User = require('../models/user');

const getRoomID = (a, b) => {
    return (
        a > b ? 
        `${a},${b}`
        :
        `${b},${a}`
    )
}

const insertMessage = async (selfid, user1, user2, message) => {
    const user1Obj = await User.findById(user1).exec();
    const user2Obj = await User.findById(user2).exec();

    if (user1Obj === null || user2Obj === null){ 
        logger('User not found. Message is ignored.');
        return;
    }        
    if ((selfid !== user1 && selfid !== user2) || (message.author._id !== selfid)){ 
        logger('No permission. Message is ignored.');
        return;
    }

    let chat = await Chat.findOne({room : getRoomID(user1, user2)}).exec();

    if (chat === null){
        chat = new Chat({
            room : getRoomID(user1, user2),
            users : [
                user1, user2
            ],
            messages : []
        });
    }

    const msg = await(new Message(
    {
        content : message.content,
        markdown : message.markdown,
        math : message.math,
        author : message.author._id,
        date : Date.now()
    }
    )).save();
    chat.messages.push(msg._id);
    await chat.save();
}

module.exports = {
    getRoomID,
    insertMessage
}