const Message = require('../models/message');
const Chat = require('../models/chat');

const getRoomID = (a, b) => {
    return (
        a > b ? 
        `${a},${b}`
        :
        `${b},${a}`
    )
}

const insertMessage = async (user1, user2, message) => {
    let chat = await Chat.findOne({room : getRoomID(user1, user2)}).exec();

    if (chat === null){
        chat = new Chat({
            room : getRoomID(user1, user2)
        });
    }

    const msg = await(new Message(message)).save();
    chat.messages.push(msg._id);
    await chat.save();
}

module.exports = {
    getRoomID,
    insertMessage
}