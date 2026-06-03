const express = require('express');
const router = express.Router();


const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { getAllUser, deleteUser, setUser, getAllAdminUser, insertAdminUser, userStatus, getAllCustomerUser, getParticularUser, getSearchUsers } = require('../../controller/admin/users/adminUserController');
const { getPermisionMainRoute, createPermision, getPermisions, getParticularPermisions, editPermision } = require('../../controller/admin/users/adminPermisionController');


// Users
router.route('/getAllUser').post(adminAuthMiddleWare, getAllUser);
router.route('/setUser').post(adminAuthMiddleWare, setUser);
router.route('/deleteUser').post(adminAuthMiddleWare, deleteUser);


// Admin User
router.route('/getAllAdminUser').get(adminAuthMiddleWare, getAllAdminUser);
router.route('/insertAdminUser').post(adminAuthMiddleWare, insertAdminUser);
router.route('/adminUserStatus').get(adminAuthMiddleWare, userStatus);

// Customer User
router.route('/getAllusers').get(adminAuthMiddleWare, getAllCustomerUser);
router.route('/getParticularUser').get(adminAuthMiddleWare, getParticularUser);
router.route('/usersStatus').get(adminAuthMiddleWare, userStatus);
router.route('/getUserSearch').post(adminAuthMiddleWare, getSearchUsers);


// Permision 
router.route('/getPermisionMainRoute').get(adminAuthMiddleWare, getPermisionMainRoute);
router.route('/createPermision').post(adminAuthMiddleWare, createPermision);
router.route('/getPermisions').get(adminAuthMiddleWare, getPermisions);
router.route('/getParticularPermisions').get(adminAuthMiddleWare, getParticularPermisions);
router.route('/editPermision').post(adminAuthMiddleWare, editPermision);


module.exports = router;