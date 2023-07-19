const logger = require('debug')('link-api:socket')
const { instrument } = require('@socket.io/admin-ui')
const chatService = require('./services/chat.service');
const io = require('socket.io')(3002,
    {
        cors: {
            origin : [process.env.CLIENT_URL, 'https://admin.socket.io:3000'],
            credentials: true,
        }
    }
)

io.on('connection', (socket) => {
    socket.on('join', (users) => {
        const roomid = chatService.getRoomID(users[0], users[1]);
        logger(`Client join room ${roomid}`);
        socket.join(roomid);
    })

    socket.on('send', async (formData, users, userid) => {
        const roomid = chatService.getRoomID(users[0], users[1]);
        logger('Message received client.')
        socket.to(roomid).emit('receive', formData);
        logger('Message is broadcasted to clients in the room except sender.')
        chatService.insertMessage(userid, users[0], users[1], formData);
    })
})

instrument(io, {auth : false, mode : 'development'})