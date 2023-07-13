const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const hashPassword = (input) => {
    return bcrypt.hashSync(input, process.env.BCRYPT_SALT);
}

const verifyPassword = (input, password) => {
    return bcrypt.compareSync(input, password);
};

/*

email token - user object
the rest - user id

*/
const generateToken = (obj, type) => {
    if (type === 'access'){
        return jwt.sign(obj, process.env.ACCESS_SECRET, {expiresIn : '1h'});
    }
    else if (type === 'refresh'){
        return jwt.sign(obj, process.env.REFRESH_SECRET, {expiresIn : '30d'});
    }
    else if (type === 'email'){
        return jwt.sign(obj, process.env.EMAIL_SECRET, {expiresIn : '20m'});
    }else{
        return jwt.sign(obj, process.env.PASSWORD_SECRET, {expiresIn : '20m'});
    }
};

const verifyToken = (token, type) => {
    const ret = {status : true};
    try{
        if (type === 'access'){
            ret.decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        }
        else if (type === 'refresh'){
            ret.decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        }
        else if (type === 'email'){
            ret.decoded = jwt.verify(token, process.env.EMAIL_SECRET);
        }else{
            ret.decoded = jwt.verify(token, process.env.PASSWORD_SECRET);
        }
        return ret;
    }
    catch (err) {
        ret.status = false;
        if (err.name === 'TokenExpiredError') {
            ret.error = 'expired';
        }else{
            ret.error = 'invalid';
        }
        return ret;
    }
}


module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken
}