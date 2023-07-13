const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        email : {
            type : String,
            required : true 
        },
        password : {
            type : String,
            maxLength : 256,
            required : true
        },
        first_name : {
            type : String,
            maxLength : 256,
            required : true
        },
        last_name : {
            type : String,
            maxLength : 256,
            required : true
        },
        friends : [
            {
                type : Schema.Types.ObjectId,
                ref : 'User'
            }
        ],
        friend_requests : [
            {
                type : Schema.Types.ObjectId,
                ref : 'User'
            }
        ],
        posts : [
            {
                type : Schema.Types.ObjectId,
                ref : 'Post'
            }
        ],
        image : {
            type : Boolean,
            required : true
        }
    }
)

module.exports = mongoose.model('User', UserSchema);