const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getNoticesListHandler,
    getNoticeStatsHandler,
    getNoticeDetailsHandler,
    createNoticeHandler,
    updateNoticeHandler,
    togglePinNoticeHandler,
    deleteNoticeHandler
} = require('../../controller/admin/noticeController');

// Routes accessible to all admin users (Super Admin + Regular Staff)
router.get('/', adminAuthMiddleWare, getNoticesListHandler);
router.get('/stats', adminAuthMiddleWare, getNoticeStatsHandler);
router.get('/:id', adminAuthMiddleWare, getNoticeDetailsHandler);

// Management routes (Super Admin checked inside controller)
router.post('/', adminAuthMiddleWare, createNoticeHandler);
router.put('/:id', adminAuthMiddleWare, updateNoticeHandler);
router.patch('/:id/pin', adminAuthMiddleWare, togglePinNoticeHandler);
router.delete('/:id', adminAuthMiddleWare, deleteNoticeHandler);

module.exports = router;
