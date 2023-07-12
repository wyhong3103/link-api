const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
    {
        author : {
            type : Schema.Types.ObjectId,
            ref : 'User',
            required : true
        },
        content : {
            type : String,
            required : true
        },
        markdown : {
            type : Boolean,
            required : true
        },
        math : {
            type : Boolean,
            required : true
        },
        date : {
            type : Date,
            required : true
        }
    }
)

module.exports = mongoose.model('Comment', CommentSchema);