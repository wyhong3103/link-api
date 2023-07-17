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
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Login details did not pass validation`);
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = await User.findOne({email : req.body.email}).exec();

            if (user === null){
                logger('Email is not found.');
                res.status(404).json({
                    status : false,
                    error : { result : 'Email not found.'}
                })
                return;
            }

            if (authService.verifyPassword(req.body.password, user.password)){
                logger('Password matched.');
                const refreshToken = authService.generateToken({userid : user._id}, 'refresh');

                const token = new Token({
                    token : refreshToken,
                    token_type : 'refresh',
                    user : user._id,
                    expiresAt : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
                })

                await token.save();
                
                res.cookie('accessToken', authService.generateToken({userid : user._id}, 'access'), {maxAge : 3600000, httpOnly : true});
                res.cookie('refreshToken',refreshToken, {maxAge : 720 * 3600000, httpOnly : true});
                logger('Cookies are set.');
                res.json(
                    {
                        userid : user._id,
                    }
                )
            }else{
                logger('Password does not match.');
                res.status(401).json(
                    {
                        status : false,
                        error : {result : 'Password does not match.'}
                    }
                )
            }
        }
    )
]

const logout = asyncHandler(
    async (req,res) => {
        res.clearCookie('accessToken');
        await Token.deleteOne({token : req.refreshToken}).exec();
        res.clearCookie('refreshToken');
        logger('Acess token and refresh token is removed from cookies if there is any.')
        res.json({
            status : true,
            message : "Logged out."
        })
    }
)


const refresh = asyncHandler(
    async (req, res) => {
        if (Object.hasOwnProperty.bind(req.cookies)('refreshToken')){
            const token = req.cookies.refreshToken;

            const result = authService.verifyToken(token, 'refresh');

            const tokenExist = await Token.findOne({token : token}).exec();

            if (!result.status || tokenExist === null){
                if (!result.status) logger(`Refresh token is ${result.error}.`);
                if (tokenExist === null) logger('Refresh token is not found in the database.');
                res.status(404).json({
                    status : false,
                    error : { result : 'Refresh token is invalid'}
                })
                return;
            }

            logger('New access token is generated and set to cookie.')
            res.cookie('accessToken', authService.generateToken({userid : result.decoded.userid}, 'access'), {maxAge : 3600000, httpOnly : true});
            const name = (await User.findById(result.decoded.userid).select('first_name last_name'))
            res.json({
                status : true,
                userid : result.decoded.userid,
                first_name : name.first_name,
                last_name : name.last_name
            })
        }else{
            logger('Refresh token is not found in the cookies.')

            res.status(404).json({
                status : false,
                error : { result : 'Refresh token is invalid'}
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
    .withMessage('Confirmation password does not match.'),
    asyncHandler(
        async (req, res) => {
            const err = validationResult(req);
            
            if (!err.isEmpty()){
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Registration details did not pass the validation.`)
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
                     error: { email : 'Email already exist.'}
                });
                return;
            }

            const user = {
                email : req.body.email,
                password : authService.hashPassword(req.body.password),
                first_name : req.body.first_name,
                last_name : req.body.last_name,
                image : ""
            };
            
            const emailToken = authService.generateToken(user, 'email');
            
            const emailVerificationStatus = emailService.sendVerificationEmail(req.body.email, emailToken);

            if (!emailVerificationStatus){
                logger('Verification email is not sent.')
                res.status(400).json({
                    status : false,
                    error : {result : 'Something went wrong, please try again later.'}
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

        const result = authService.verifyToken(emailToken, 'email');
        
        if (!result.status){
            logger(`Email token is ${result.error}.`);
            res.status(403).json({
                status : false,
                error : {result : `Token is ${result.error}.`}
            })
            return;
        }

        const userExist = await User.findOne({email : result.decoded.email}).exec();

        if (userExist === null){
            const user = new User(result.decoded);
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
            res.status(404).json({
                status : false,
                error : {result : 'Email is not found.'}
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
                error : {result : 'Something went wrong, please try again later.'}
            })
            return;
        }
        logger('Reset email is sent.');

        const token = new Token(
            {
                token : resetToken,
                token_type : 'reset',
                user : user._id,
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
                const errorMessages = {};
                
                for(const i of err.array()){
                    errorMessages[i.path] = i.msg;
                }

                logger(`Reset password details did not pass the validation.`)
                res.status(400).json({
                     status : false,
                     error: errorMessages 
                });
                return;
            }

            const result = authService.verifyToken(req.body.resetToken, 'reset');

            const token = await Token.findOne({token : req.body.resetToken}).exec();

            if (!result.status || token === null){
                logger(`Reset token is ${result.error}.`);
                res.status(404).json({
                    status : false,
                    error : {result : `Token is ${result.error}.`}
                })
                return;
            }

            await Token.deleteMany({user : result.decoded.userid});
            logger('All old tokens associated with user is destroyed.');

            const user = await User.findById(result.decoded.userid).exec();

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

const get_auth_status = asyncHandler(
    async (req, res) => {
        const name = (await User.findById(req.userid).select('first_name last_name'))
        res.json({
            status : true,
            userid : req.userid,
            first_name : name.first_name,
            last_name : name.last_name
        })
})

module.exports = {
    login,
    logout,
    refresh,
    register,
    verify_email,
    verify_reset_password,
    reset_password,
    get_auth_status
}