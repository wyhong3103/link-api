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
        },
        user : {
            type : Schema.Types.ObjectId,
            ref : "User"
        },
        expiresAt: { type: Date, default: Date.now },
    }
)

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', TokenSchema);