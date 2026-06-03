const express = require('express');
const { viewProfile, getUserSubscription, getUserSubscriptionHistory, editProfile } = require('../controller/user/userController');
const {authMiddleWare} = require('../middleware/middleware');
const router = express.Router();

router.route('/getUserDetails').get(authMiddleWare, viewProfile)
router.route('/editProfile').post(authMiddleWare, editProfile)
router.route('/getUserSubscription').get(authMiddleWare, getUserSubscription)
router.route('/getSubscriptionHistory').get(authMiddleWare, getUserSubscriptionHistory)

module.exports = router;