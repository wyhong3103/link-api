const logger = require('debug')('link-api:auth-controller')
const User = require('../models/user');
const Token = require('../models/token');
const asyncHandler = require('express-async-handler')
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const { body, validationResult } = require('express-validator');

const login = [
    body('email')
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty."),
    body('password')
    .notEmpty()
    .withMessage("Password cannot be empty."),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);

            if (!err.isEmpty()){
                const errorMessages = err.array().map(error => {
                    return { field: error.param, message: error.msg };
                });
                logger(`Login details did not pass validation - ${errorMessages}`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = await User.findOne({email : req.body.email}).exec();

            if (user === null){
                logger('Email is not found.');
                res.status(401).json({
                    status : false,
                    error : [{ result : 'Email not found.'}]
                })
                return;
            }

            if (authService.verifyPassword(req.body.password, user.password)){
                logger('Password matched.');
                const refreshToken = authService.generateToken({userid : user._id}, 'refresh');

                const token = new Token({
                    token : refreshToken,
                    token_type : 'refresh',
                    expiresAt : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
                })

                await token.save();

                res.json(
                    {
                        userid : user._id,
                        accessToken : authService.generateToken({userid : user._id}, 'access'),
                        refreshToken : refreshToken
                    }
                )
            }else{
                logger('Password does not match.');
                res.status(401).json(
                    {
                        status : false,
                        error : [{result : 'Password does not match.'}]
                    }
                )
            }
        }
    )
]


const refresh = asyncHandler(
    async (req, res) => {
        if (req.cookies.hasOwnProperty('refreshToken')){
            const token = req.cookies.refreshToken;

            const decoded = authService.verifyToken(token, 'refresh');

            const tokenExist = await Token.findOne({token : token}).exec();

            if (!decoded || tokenExist === null){
                if (!decoded) logger('Refresh token is either expired or does not exist.');
                if (tokenExist === null) logger('Refresh token is not found in the database.');
                res.status(403).json({
                    status : false,
                    error : [{ 'result' : 'Refresh token is invalid'}]
                })
                return;
            }

            logger('New access token is generated and sent to user.')

            res.json(
                {
                    userid : decoded.userid,
                    accessToken : authService.generateToken({userid : decoded.userid}, 'access'),
                }
            )
        }else{
            logger('Refresh token is not found in the cookies.')

            res.status(403).json({
                status : false,
                error : [{ 'result' : 'Refresh token is invalid'}]
            })
        }
    }
)

const register = [
    body('first_name')
    .trim()
    .isLength({min : 1, max :  50})
    .withMessage('First name must be within 1 to 50 characters')
    .escape(),
    body('last_name')
    .trim()
    .isLength({min : 1, max :  50})
    .withMessage('Last name must be within 1 to 50 characters')
    .escape(),
    body('email')
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage('Invalid email body.'),
    body('password')
    .isLength({min : 8, max : 128})
    .withMessage('Password must be within 8 to 128 characters'),
    body('repassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password confirmation does not match.'),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);
            
            if (!err.isEmpty()){
                const errorMessages = err.array().map(error => {
                    return { field: error.param, message: error.msg };
                });
                logger(`Registration details did not pass the validation. - ${errorMessages}`)
                res.status(400).json({
                     status : false,
                     error: errorMessages 
                });
                return;
            }

            const emailExist = await User.findOne({email : req.body.email}).exec();

            if (emailExist !== null){
                logger('Email already exist.')
                res.status(400).json({
                     status : false,
                     error: [{ email : 'Email already exist.'}]
                });
                return;
            }

            const user = {
                email : req.body.email,
                password : authService.hashPassword(req.body.password),
                first_name : req.body.first_name,
                last_name : req.body.last_name,
            };
            
            const emailToken = authService.generateToken(user, 'email');
            
            const emailVerificationStatus = emailService.sendVerificationEmail(req.body.email, emailToken);

            if (!emailVerificationStatus){
                logger('Verification email is not sent.')
                res.status(400).json({
                    status : false,
                    error : [{result : 'Something went wrong, please try again later.'}]
                })
                return;
            }
            logger('Verification email is sent.');

            res.json({
                status : true,
                message : "Verification email is sent."
            })
        }
    )
]

const verify_email = asyncHandler(
    async (req, res) => {
        const emailToken = req.body.emailToken;

        const decoded = authService.verifyToken(emailToken, 'email');
        
        if (!decoded){
            logger('Email token is invalid.');
            res.status(403).json({
                status : false,
                error : [{result : 'Token is invalid.'}]
            })
            return;
        }

        const userExist = await User.findOne({email : decoded.email}).exec();

        if (userExist === null){
            const user = new User(decoded);
            await user.save();
        }
        logger('User is verified.');

        res.json({
            status : true,
            message : "User is verified."
        })
    }
)

const reset_password = asyncHandler(
    async (req, res) => {
        const user = await User.findOne({email : req.body.email}).exec();

        if (user === null){
            logger('Email for reset is not found.');
            res.status(403).json({
                status : false,
                error : [{result : 'Email is not found.'}]
            })
            return;
        }
        
        logger('Email for reset is found.');

        const resetToken = authService.generateToken({userid : user._id}, 'reset');

        const emailResetStatus = emailService.sendPasswordResetEmail(req.body.email, resetToken);

        if (!emailResetStatus){
            logger('Reset email is not sent.')
            res.status(400).json({
                status : false,
                error : [{result : 'Something went wrong, please try again later.'}]
            })
            return;
        }
        logger('Reset email is sent.');

        const token = new Token(
            {
                token : resetToken,
                token_type : 'reset',
                expiresAt : new Date(Date.now() + (20 * 60 * 1000))
            }
        )
        await token.save();
        logger('Reset token is saved to database');


        res.json({
            status : true,
            message : "Reset email is sent."
        })

    }
)

const verify_reset_password = [
    body('password')
    .isLength({min : 8, max : 128})
    .withMessage('Password must be within 8 to 128 characters'),
    body('repassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password confirmation does not match.'),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);
            
            if (!err.isEmpty()){
                const errorMessages = err.array().map(error => {
                    return { field: error.param, message: error.msg };
                });
                logger(`Reset password details did not pass the validation. - ${errorMessages}`)
                res.status(400).json({
                     status : false,
                     error: errorMessages 
                });
                return;
            }

            const decoded = authService.verifyToken(req.body.resetToken, 'reset');

            const token = await Token.findOne({token : req.body.resetToken}).exec();

            if (!decoded || token === null){
                logger('Reset token is invalid.');
                res.status(403).json({
                    status : false,
                    error : [{result : 'Token is invalid.'}]
                })
                return;
            }

            await Token.findByIdAndDelete(token._id);
            logger('Reset token is destroyed.');

            const user = await User.findById(decoded.userid).exec();

            user.password = authService.hashPassword(req.body.password);

            await user.save();
            logger('Password changed.');

            res.json({
                status : true,
                message : 'Password changed.'
            })
        }
    )
]

module.exports = {
    login,
    refresh,
    register,
    verify_email,
    verify_reset_password,
    reset_password
}