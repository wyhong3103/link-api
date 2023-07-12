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
                const errorMessages = errors.array().map(error => {
                    return { field: error.param, message: error.msg };
                });
                res.status(401).json({
                    status : false,
                    error : errorMessages
                })
                return;
            }

            const user = await User.findOne({email : req.body.email}).exec();

            if (user === null){
                res.status(401).json({
                    status : false,
                    error : [{ 'result' : 'Email not found.'}]
                })
                return;
            }

            if (authService.verifyPassword(req.body.password, user.password)){

                const refreshToken = authService.generateToken({userid : user._id}, 'refresh');

                const token = new Token({
                    token : token,
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
                res.status(401).json(
                    {
                        status : false,
                        error : [{'result' : 'Password does not match.'}]
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
                res.status(403).json({
                    status : false,
                    error : [{ 'result' : 'Refresh token is invalid'}]
                })
            }

            res.json(
                {
                    userid : decoded.userid,
                    accessToken : authService.generateToken({userid : decoded.userid}, 'access'),
                }
            )
        }else{
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
                const errorMessages = errors.array().map(error => {
                    return { field: error.param, message: error.msg };
                });
                res.status(400).json({
                     status : false,
                     error: errorMessages 
                });
                return;
            }

            const emailExist = await User.findOne({email : req.body.email}).exec();

            if (emailExist !== null){
                res.status(400).json({
                     status : false,
                     error: [{ email : 'Email already exist.'}]
                });
                return;
            }

            const user = new User(
                {
                    email : req.body.email,
                    password : authService.hashPassword(req.body.password),
                    first_name : req.body.first_name,
                    last_name : req.body.last_name,
                }
            )
            
            const emailToken = authService.generateToken(user, 'email');
            
            if (!emailService.sendVerificationEmail(req.body.email, emailToken)){
                res.status(400).json({
                    status : false,
                    error : [{result : 'Something went wrong, please try again later.'}]
                })
            }

            const token = new Token({
                token : emailToken,
                token_type : 'email',
                expiresAt : new Date(Date.now() + (20 * 60 * 1000))
            })

            await token.save();
            res.json({
                status : true,
            })
        }
    )
]
