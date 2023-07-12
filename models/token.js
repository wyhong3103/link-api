const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema(
    {
        token : {
            type : String,
            required : true
        },
        token_type : {
            type : String,
            required : true,
            enum : ['refresh', 'email', 'password']
        }
    }
)

module.exports = mongoose.model('Token', TokenSchema);