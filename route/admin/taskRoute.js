const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getAdminUsersListHandler,
    getTaskStatsHandler,
    getTasksListHandler,
    createTaskHandler,
    getTaskDetailsHandler,
    updateTaskStatusHandler,
    updateTaskHandler,
    deleteTaskHandler,
    addTaskCommentHandler
} = require('../../controller/admin/taskController');

// All task routes require admin authentication (Super Admin & Admin Users)
router.get('/users', adminAuthMiddleWare, getAdminUsersListHandler);
router.get('/stats', adminAuthMiddleWare, getTaskStatsHandler);
router.get('/', adminAuthMiddleWare, getTasksListHandler);
router.post('/', adminAuthMiddleWare, createTaskHandler);
router.get('/:id', adminAuthMiddleWare, getTaskDetailsHandler);
router.patch('/:id/status', adminAuthMiddleWare, updateTaskStatusHandler);
router.put('/:id', adminAuthMiddleWare, updateTaskHandler);
router.delete('/:id', adminAuthMiddleWare, deleteTaskHandler);
router.post('/:id/comments', adminAuthMiddleWare, addTaskCommentHandler);

module.exports = router;
