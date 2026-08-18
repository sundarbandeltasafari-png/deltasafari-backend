const express = require('express');
const router = express.Router();

const { 
    register, 
    login, 
    resetPasswordLink, 
    verifyResetOtp,
    resetPassword, 
    resendResetOtp,
    registerOtpValidate, 
    loginOtpValidate, 
    resendOtp, 
    googleLogin 
} = require('../controller/auth/authController');
const { authMiddleWare } = require('../middleware/middleware');
const { viewProfile } = require('../controller/user/userController');

router.route('/register').post(register);
router.route('/registerOtpValidate').post(registerOtpValidate);
router.route('/login').post(login);
router.route('/googleLogin').post(googleLogin);
router.route('/resendOtp').post(resendOtp);

// User Forgot / Reset Password Endpoints
router.route('/resetpasswordreq').post(resetPasswordLink);
router.route('/forgot-password').post(resetPasswordLink);
router.route('/verify-reset-otp').post(verifyResetOtp);
router.route('/resetPassword').post(resetPassword);
router.route('/resend-reset-otp').post(resendResetOtp);

router.route('/getUserDetails').get(authMiddleWare, viewProfile);
module.exports = router;