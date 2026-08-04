const express = require('express');
const { viewProfile, getUserSubscription, getUserSubscriptionHistory, editProfile, changePassword } = require('../controller/user/userController');
const { authMiddleWare } = require('../middleware/middleware');
const { createUploader } = require('../helper/uploadHelper');

const profileUploader = createUploader('image', 'profiles');
const router = express.Router();

router.route('/getUserDetails').get(authMiddleWare, viewProfile);
router.route('/editProfile').post(authMiddleWare, profileUploader.single('profile_pic'), editProfile);
router.route('/changePassword').post(authMiddleWare, changePassword);
router.route('/getUserSubscription').get(authMiddleWare, getUserSubscription);
router.route('/getSubscriptionHistory').get(authMiddleWare, getUserSubscriptionHistory);

module.exports = router;