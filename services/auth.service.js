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


module.exports = {
    verifyPassword
}