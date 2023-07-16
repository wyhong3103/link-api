const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authorizeUser } = require('../middlewares/auth.middleware');

/*

Input :

body : {
    email, password
}

Output :

userid, accessToken, refreshToken

*/
router.post('/login', authController.login);

router.post('/logout', authController.logout);

/*

Input :

cookie : {
    refreshToken
}

Output :

accessToken

*/
router.get('/refresh', authController.refresh);

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

router.get('/get-status', authorizeUser, authController.get_auth_status)

module.exports = router;