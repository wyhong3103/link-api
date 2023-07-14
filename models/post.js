const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
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
        },
        comments : [
            {
                type : Schema.Types.ObjectId,
                ref : 'Comment'
            }
        ],
        likes : [
            {
                type : Schema.Types.ObjectId,
                ref : 'User'
            }
        ],
        image : {
            type : String,
            required : true
        }
    }
)

module.exports = mongoose.model('Post', PostSchema);