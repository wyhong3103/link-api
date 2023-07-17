const authService = require('../services/auth.service');

const authorizeUser = (req, res, next) => {
    if (typeof req.cookies === 'object'){
        if (Object.hasOwnProperty.bind(req.cookies)('accessToken')){
            const result = authService.verifyToken(req.cookies.accessToken,'access');
            if (!result.status){
                console.log(result.error);
                if (result.error !== 'expired'){
                    res.status(403).json({
                        status : false,
                        token : result.error,
                        error : {result : `Token is ${result.error}.`}
                    })
                    return;
                }
            }else{
                req.userid = result.decoded.userid;
                next();
                return;
            }
        }
        if (Object.hasOwnProperty.bind(req.cookies)('refreshToken')){
            req.refresh = true;
            next();
            return;
        }
    }

    res.status(403).json({
        status : false,
        error : {result : 'Please log in.'}
    });
}

module.exports = {
    authorizeUser
}