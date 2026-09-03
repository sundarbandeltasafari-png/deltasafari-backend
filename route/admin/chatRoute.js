const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getChatUsersHandler,
    getUserConversationsHandler,
    getOrCreateDirectConversationHandler,
    getConversationMessagesHandler,
    sendMessageHandler,
    uploadChatFileHandler,
    markReadHandler,
    getChatUnreadCountHandler
} = require('../../controller/admin/chatController');

router.get('/users', adminAuthMiddleWare, getChatUsersHandler);
router.get('/unread-count', adminAuthMiddleWare, getChatUnreadCountHandler);
router.get('/conversations', adminAuthMiddleWare, getUserConversationsHandler);
router.post('/conversations/direct', adminAuthMiddleWare, getOrCreateDirectConversationHandler);
router.get('/conversations/:id/messages', adminAuthMiddleWare, getConversationMessagesHandler);
router.post('/conversations/:id/messages', adminAuthMiddleWare, sendMessageHandler);
router.post('/conversations/:id/read', adminAuthMiddleWare, markReadHandler);
router.post('/upload', adminAuthMiddleWare, uploadChatFileHandler);

module.exports = router;
