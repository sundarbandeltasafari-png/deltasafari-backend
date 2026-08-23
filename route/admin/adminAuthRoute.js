const express = require('express');
const router = express.Router();

const { login, resetPasswordLink, verifyOtp, otpvalidate, resendOtp, viewProfile } = require('../../controller/admin/adminAuthController');
const { adminAuthMiddleWare } = require('../../middleware/middleware');

router.route('/login').post(login);
router.route('/resetpassword').post(resetPasswordLink);
router.route('/verify-otp').post(verifyOtp);
router.route('/otpvalidate').post(otpvalidate);
router.route('/resend-otp').post(resendOtp);
router.route('/getUserDetails').get(adminAuthMiddleWare, viewProfile);
router.route('/viewprofile').get(adminAuthMiddleWare, viewProfile);

module.exports = router;