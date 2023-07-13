const authService = require('../services/auth.service');

const authorizeUser = (req, res, next) => {
    if (req.cookies.hasOwnProperty('accessToken')){
        const result = authService.verifyToken(req.cookies.accessToken,'access');
        if (!result.status){
            res.status(403).json({
                status : false,
                token : result.error,
                error : [{result : `Token is ${result.error}.`}]
            })
        }else{
            req.userid = result.decoded.userid;
            next();
        }
    }else {
        res.status(403).json({
            status : false,
            error : [{result : 'Token is not found'}]
        });
    }
}

module.exports = {
    authorizeUser
}