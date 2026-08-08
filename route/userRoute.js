const express = require('express');
const { 
    viewProfile, 
    getUserSubscription, 
    getUserSubscriptionHistory, 
    editProfile, 
    changePassword,
    getAgentDashboardStats,
    updateAgentBankDetails,
    requestAgentWithdrawal,
    createAgentBooking,
    getAgentBookings,
    getReferralStats,
    getCustomPackageEnquiries
} = require('../controller/user/userController');
const { authMiddleWare } = require('../middleware/middleware');
const { createUploader } = require('../helper/uploadHelper');

const profileUploader = createUploader('image', 'profiles');
const router = express.Router();

router.route('/getUserDetails').get(authMiddleWare, viewProfile);
router.route('/editProfile').post(authMiddleWare, profileUploader.single('profile_pic'), editProfile);
router.route('/changePassword').post(authMiddleWare, changePassword);
router.route('/getUserSubscription').get(authMiddleWare, getUserSubscription);
router.route('/getSubscriptionHistory').get(authMiddleWare, getUserSubscriptionHistory);

// --- Custom Package Enquiries Route ---
router.route('/getCustomPackageEnquiries').get(authMiddleWare, getCustomPackageEnquiries).post(authMiddleWare, getCustomPackageEnquiries);

// --- Referral Program Route ---
router.route('/getReferralStats').get(authMiddleWare, getReferralStats).post(authMiddleWare, getReferralStats);

// --- Agent B2B & Wallet Routes ---
router.route('/getAgentDashboardStats').get(authMiddleWare, getAgentDashboardStats);
router.route('/updateAgentBankDetails').post(authMiddleWare, updateAgentBankDetails);
router.route('/requestAgentWithdrawal').post(authMiddleWare, requestAgentWithdrawal);
router.route('/createAgentBooking').post(authMiddleWare, createAgentBooking);
router.route('/getAgentBookings').get(authMiddleWare, getAgentBookings);

module.exports = router;