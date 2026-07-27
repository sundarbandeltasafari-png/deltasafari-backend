const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getAllContactQueriesAdmin,
    getParticularContactQueryAdmin,
    updateContactQueryAdmin,
    deleteContactQueryAdmin
} = require('../../controller/admin/service/adminServiceController');

// All protected with admin middleware
router.route('/').get(adminAuthMiddleWare, getAllContactQueriesAdmin);
router.route('/all').get(adminAuthMiddleWare, getAllContactQueriesAdmin);
router.route('/detail').get(adminAuthMiddleWare, getParticularContactQueryAdmin).post(adminAuthMiddleWare, getParticularContactQueryAdmin);
router.route('/update').put(adminAuthMiddleWare, updateContactQueryAdmin).post(adminAuthMiddleWare, updateContactQueryAdmin);
router.route('/delete').delete(adminAuthMiddleWare, deleteContactQueryAdmin);

module.exports = router;
