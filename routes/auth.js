const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);

router.post('/refresh', authController.refresh);

router.post('/register', authController.register);

router.post('/verify-email', authController.verify_email);

router.post('/reset-password', authController.reset_password);

router.post('/verify-reset-password', authController.verify_reset_password);

module.exports = router;