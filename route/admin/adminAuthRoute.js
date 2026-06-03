const express = require('express');
const router = express.Router();

const { login, resetPasswordLink, otpvalidate, viewProfile } = require('../../controller/admin/adminAuthController');
const { adminAuthMiddleWare } = require('../../middleware/middleware');

router.route('/login').post(login);
router.route('/resetpassword').post(resetPasswordLink);
router.route('/otpvalidate').post(otpvalidate);
router.route('/getUserDetails').get(adminAuthMiddleWare, viewProfile);


module.exports = router;