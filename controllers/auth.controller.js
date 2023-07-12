const User = require('../models/user');
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
