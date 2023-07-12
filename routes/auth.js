const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/*

Input :

body : {
    email, password
}

Output :

if OK
{
    userid, accessToken, refreshToken
}
else
{
    error : []
}

*/
router.post('/login', authController.login);

/*

Input :

cookie : {
    refreshToken
}

Output :

if OK
{
    accessToken
}
else
{
    error : []
}
*/
router.post('/refresh', authController.refresh);

/*

Input :

body : {
    email, password, repassword, first_name, last_Name
}

Output :

if OK
{

}
else
{
    error : []
}

*/
router.post('/register', authController.register);

/*

Input :

body : {
    emailToken
}

Output :

if OK
{
        
}
else
{
    error : []
}

*/
router.post('/verify-email', authController.verify_email);

/*

Input :

body : {
    email
}

Output :

if OK
{
        
}
else
{
    error : []
}
*/
router.post('/reset-password', authController.reset_password);

/*

Input :

body : {
    resetToken, password, repassword
}

Output :

if OK
{
        
}
else
{
    error : []
}
*/
router.post('/verify-reset-password', authController.verify_reset_password);

module.exports = router;