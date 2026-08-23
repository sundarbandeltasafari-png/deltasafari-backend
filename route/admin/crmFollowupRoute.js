const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    saveLeadFollowup,
    getFollowupsList,
    getFollowupStats,
    getSingleLeadFollowup,
    getFollowupLogs
} = require('../../controller/admin/crmFollowupController');

// All endpoints protected with adminAuthMiddleWare
router.post('/save', adminAuthMiddleWare, saveLeadFollowup);
router.get('/', adminAuthMiddleWare, getFollowupsList);
router.get('/stats', adminAuthMiddleWare, getFollowupStats);
router.get('/contact/:contactId', adminAuthMiddleWare, getSingleLeadFollowup);
router.get('/logs/:contactId', adminAuthMiddleWare, getFollowupLogs);

module.exports = router;
