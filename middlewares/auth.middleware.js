const authService = require('../services/auth.service');

const authorizeUser = (req, res, next) => {
    if (typeof req.cookies === 'object' && Object.hasOwnProperty.bind(req.cookies)('accessToken')){
        const result = authService.verifyToken(req.cookies.accessToken,'access');
        if (!result.status){
            if (result.error === 'expired'){
                req.refresh = true;
                next();
            }else{
                res.status(403).json({
                    status : false,
                    token : result.error,
                    error : {result : `Token is ${result.error}.`}
                })
            }
        }else{
            req.userid = result.decoded.userid;
            next();
        }
    }else {
        res.status(403).json({
            status : false,
            error : {result : 'Please log in.'}
        });
    }
}

module.exports = {
    authorizeUser
}