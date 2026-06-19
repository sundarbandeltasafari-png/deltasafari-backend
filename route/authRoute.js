const express = require('express');
const router = express.Router();

const { register, login, resetPasswordLink, registerOtpValidate, registerPartials, validatePartials, resetPassword, loginOtpValidate, resendOtp } = require('../controller/auth/authController');
const {authMiddleWare} = require('../middleware/middleware');
const { viewProfile } = require('../controller/user/userController');

// router.route('/registerPartials').post(registerPartials);
// router.route('/validatePartials').post(validatePartials);
// router.route('/loginOtpValidate').post(loginOtpValidate);



router.route('/register').post(register);
router.route('/registerOtpValidate').post(registerOtpValidate);
router.route('/login').post(login);
router.route('/resendOtp').post(resendOtp);
router.route('/resetpasswordreq').post(resetPasswordLink);
router.route('/resetPassword').post(resetPassword);
router.route('/getUserDetails').get(authMiddleWare, viewProfile);
module.exports = router;