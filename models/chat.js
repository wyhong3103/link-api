const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
    {
        room : {
            type : String,
            required : true
        },
        messages : [
            {
                type : Schema.Types.ObjectId,
                ref : 'Message'
            }
        ]
    }
)

module.exports = mongoose.model('Chat', ChatSchema);