const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/*

Input :

body : {
    email, password
}

Output :

userid, accessToken, refreshToken

*/
router.post('/login', authController.login);

/*

Input :

cookie : {
    refreshToken
}

Output :

accessToken

*/
router.post('/refresh', authController.refresh);

/*

Input :

body : {
    email, password, repassword, first_name, last_Name
}


*/
router.post('/register', authController.register);

/*

Input :

body : {
    emailToken
}

*/
router.post('/verify-email', authController.verify_email);

/*

Input :

body : {
    email
}

*/
router.post('/reset-password', authController.reset_password);

/*

Input :

body : {
    resetToken, password, repassword
}

*/
router.post('/verify-reset-password', authController.verify_reset_password);

module.exports = router;