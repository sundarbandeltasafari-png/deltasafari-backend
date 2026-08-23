const express = require('express');
const router = express.Router();


const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { 
    getAllUser, 
    deleteUser, 
    setUser, 
    getAllAdminUser, 
    insertAdminUser, 
    userStatus, 
    getAllCustomerUser, 
    getParticularUser, 
    getSearchUsers, 
    getReferralOverview,
    getParticularAdminUser,
    updateAdminUser,
    releaseWalletPayout,
    processWithdrawalRequest
} = require('../../controller/admin/users/adminUserController');
const { getPermisionMainRoute, createPermision, getPermisions, getParticularPermisions, editPermision, deletePermision } = require('../../controller/admin/users/adminPermisionController');


// Users
router.route('/getAllUser').post(adminAuthMiddleWare, getAllUser);
router.route('/setUser').post(adminAuthMiddleWare, setUser);
router.route('/deleteUser').post(adminAuthMiddleWare, deleteUser);

// Referral Overview
router.route('/getReferralOverview').get(adminAuthMiddleWare, getReferralOverview).post(adminAuthMiddleWare, getReferralOverview);


// Admin User
router.route('/getAllAdminUser').get(adminAuthMiddleWare, getAllAdminUser).post(adminAuthMiddleWare, getAllAdminUser);
router.route('/getAdminUserSearch').get(adminAuthMiddleWare, getAllAdminUser).post(adminAuthMiddleWare, getAllAdminUser);
router.route('/getParticularAdminUser').get(adminAuthMiddleWare, getParticularAdminUser);
router.route('/updateAdminUser').post(adminAuthMiddleWare, updateAdminUser);
router.route('/insertAdminUser').post(adminAuthMiddleWare, insertAdminUser);
router.route('/adminUserStatus').get(adminAuthMiddleWare, userStatus);

// Customer User
router.route('/getAllusers').get(adminAuthMiddleWare, getAllCustomerUser);
router.route('/getParticularUser').get(adminAuthMiddleWare, getParticularUser);
router.route('/usersStatus').get(adminAuthMiddleWare, userStatus);
router.route('/getUserSearch').post(adminAuthMiddleWare, getSearchUsers);
router.route('/releaseWalletPayout').post(adminAuthMiddleWare, releaseWalletPayout);
router.route('/processWithdrawalRequest').post(adminAuthMiddleWare, processWithdrawalRequest);


// Permision 
router.route('/getPermisionMainRoute').get(adminAuthMiddleWare, getPermisionMainRoute);
router.route('/createPermision').post(adminAuthMiddleWare, createPermision);
router.route('/getPermisions').get(adminAuthMiddleWare, getPermisions);
router.route('/getParticularPermisions').get(adminAuthMiddleWare, getParticularPermisions);
router.route('/editPermision').post(adminAuthMiddleWare, editPermision).put(adminAuthMiddleWare, editPermision);
router.route('/deletePermision').post(adminAuthMiddleWare, deletePermision).delete(adminAuthMiddleWare, deletePermision);


module.exports = router;