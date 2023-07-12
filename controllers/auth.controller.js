const User = require('../models/user');
const Token = require('../models/token');
const asyncHandler = require('express-async-handler')
const authService = require('../services/auth.service');
const { body, validationResult } = require('express-validator');

const login = [
    body('email')
    .trim()
    .isLength({min : 1})
    .withMessage("Email cannot be empty."),
    body('password')
    .isLength({min : 1})
    .withMessage("Password cannot be empty."),
    asyncHandler(
        async (req, res) => {
            const err = await validationResult(req);

            if (!err.isEmpty()){
                res.status(401).json({
                    status : false,
                    error : err.array()
                })
                return;
            }

            const user = await User.findOne({email : req.body.email}).exec();

            if (user === null){
                res.status(401).json({
                    status : false,
                    error : ['Email not found.']
                })
                return;
            }

            if (authService.verifyPassword(req.body.password, user.password)){
                res.json(
                    {
                        userid : user._id,
                        accessToken : authService.generateToken({userid : user._id}, 'access'),
                        refreshToken : authService.generateToken({userid : user._id}, 'refresh')
                    }
                )
            }else{
                res.status(401).json(
                    {
                        status : false,
                        error : ['Password does not match.']
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
                    error : ['Refresh token is invalid']
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
                error : ['Refresh token not found.']
            })
        }
    }
)

