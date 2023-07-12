const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyPassword = (input, password) => {
    return bcrypt.compareSync(input, password);
};

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
    try{
        if (type === 'access'){
            return jwt.verify(obj, process.env.ACCESS_SECRET);
        }
        else if (type === 'refresh'){
            return jwt.verify(obj, process.env.REFRESH_SECRET);
        }
        else if (type === 'email'){
            return jwt.verify(obj, process.env.EMAIL_SECRET);
        }else{
            return jwt.verify(obj, process.env.PASSWORD_SECRET);
        }
    }
    catch {
        return false;
    }
}


module.exports = {
    verifyPassword,
    generateToken,
    verifyToken
}