const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
    getAdminUsersForChat,
    getUserConversations,
    getOrCreateDirectConversation,
    getConversationMessages,
    saveMessage,
    markConversationRead,
    getConversationParticipants,
    getChatUnreadCount
} = require('../../model/admin/chatModel');
const { getIO, emitChatUnreadCount } = require('../../socket/chatSocket');

// Ensure upload directory exists
const chatUploadDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(chatUploadDir)) {
    fs.mkdirSync(chatUploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, chatUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @desc Get all admin users for chat directory
 * @route GET /admin/crm/chat/users
 */
const getChatUsersHandler = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user?.id || 1;
        const users = await getAdminUsersForChat(currentUserId);
        res.status(200).json({ status: true, users });
    } catch (err) {
        console.error('[ChatController] getChatUsers error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching chat users.' });
    }
});

/**
 * @desc Get all conversations for current user
 * @route GET /admin/crm/chat/conversations
 */
const getUserConversationsHandler = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user?.id || 1;
        const conversations = await getUserConversations(currentUserId);
        res.status(200).json({ status: true, conversations });
    } catch (err) {
        console.error('[ChatController] getUserConversations error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching conversations.' });
    }
});

/**
 * @desc Start or get direct conversation with another admin user
 * @route POST /admin/crm/chat/conversations/direct
 */
const getOrCreateDirectConversationHandler = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user?.id || 1;
        const { target_user_id } = req.body;

        if (!target_user_id) {
            return res.status(400).json({ status: false, msg: 'Target user ID is required.' });
        }

        const conversationId = await getOrCreateDirectConversation(currentUserId, target_user_id);
        res.status(200).json({ status: true, conversation_id: conversationId });
    } catch (err) {
        console.error('[ChatController] getOrCreateDirectConversation error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error creating conversation.' });
    }
});

/**
 * @desc Get messages for a conversation
 * @route GET /admin/crm/chat/conversations/:id/messages
 */
const getConversationMessagesHandler = asyncHandler(async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const currentUserId = req.user?.id || 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;

        const messages = await getConversationMessages(conversationId, currentUserId, limit);
        res.status(200).json({ status: true, messages });
    } catch (err) {
        console.error('[ChatController] getConversationMessages error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching messages.' });
    }
});

/**
 * @desc Send a message (REST API fallback)
 * @route POST /admin/crm/chat/conversations/:id/messages
 */
const sendMessageHandler = asyncHandler(async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const currentUserId = req.user?.id || 1;
        const { message, message_type, file_url, file_name, file_size, file_type } = req.body;

        const savedMessage = await saveMessage(conversationId, currentUserId, {
            message,
            message_type: message_type || 'text',
            file_url,
            file_name,
            file_size,
            file_type
        });

        // Trigger Socket.io broadcast
        const io = getIO();
        if (io) {
            io.to(`conversation_${conversationId}`).emit('receive_message', savedMessage);

            const participantIds = await getConversationParticipants(conversationId);
            participantIds.forEach(pId => {
                io.to(`user_${pId}`).emit('conversation_updated', {
                    conversation_id: conversationId,
                    last_message: savedMessage.message_type === 'image' ? '📷 Image attachment' : (savedMessage.message_type === 'file' ? `📎 ${savedMessage.file_name}` : (savedMessage.message || '')),
                    last_message_at: savedMessage.created_at,
                    last_sender_id: currentUserId,
                    sender_first_name: savedMessage.sender_first_name,
                    message: savedMessage
                });

                if (pId !== parseInt(currentUserId)) {
                    io.to(`user_${pId}`).emit('chat_notification', {
                        id: savedMessage.id,
                        conversation_id: conversationId,
                        sender_id: currentUserId,
                        sender_name: `${savedMessage.sender_first_name || 'Staff'} ${savedMessage.sender_last_name || ''}`.trim(),
                        message: savedMessage.message_type === 'image' ? '📷 Sent an image' : (savedMessage.message_type === 'file' ? `📎 Sent a file: ${savedMessage.file_name}` : (savedMessage.message || '')),
                        created_at: savedMessage.created_at
                    });
                    emitChatUnreadCount(pId);
                }
            });
        }

        res.status(201).json({ status: true, message: savedMessage });
    } catch (err) {
        console.error('[ChatController] sendMessage error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error sending message.' });
    }
});

/**
 * @desc Upload chat attachment (Image / Document / PDF / File)
 * @route POST /admin/crm/chat/upload
 */
const uploadChatFileHandler = [
    upload.single('file'),
    asyncHandler(async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: false, msg: 'No file uploaded.' });
            }

            const relativeUrl = `/uploads/chat/${req.file.filename}`;
            const formatSize = (bytes) => {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };

            res.status(200).json({
                status: true,
                msg: 'File uploaded successfully!',
                file_url: relativeUrl,
                file_name: req.file.originalname,
                file_size: formatSize(req.file.size),
                file_type: req.file.mimetype
            });
        } catch (err) {
            console.error('[ChatController] uploadChatFile error:', err);
            res.status(500).json({ status: false, msg: err.message || 'Error uploading file.' });
        }
    })
];

/**
 * @desc Mark conversation as read
 * @route POST /admin/crm/chat/conversations/:id/read
 */
const markReadHandler = asyncHandler(async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        const currentUserId = req.user?.id || 1;

        await markConversationRead(conversationId, currentUserId);
        emitChatUnreadCount(currentUserId);
        res.status(200).json({ status: true, msg: 'Conversation marked as read.' });
    } catch (err) {
        console.error('[ChatController] markRead error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error marking as read.' });
    }
});

/**
 * @desc Get total unread chat messages count for current user
 * @route GET /admin/crm/chat/unread-count
 */
const getChatUnreadCountHandler = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user?.id || 1;
        const unreadCount = await getChatUnreadCount(currentUserId);
        res.status(200).json({ status: true, unread_count: unreadCount });
    } catch (err) {
        console.error('[ChatController] getChatUnreadCount error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching unread chat count.' });
    }
});

module.exports = {
    getChatUsersHandler,
    getUserConversationsHandler,
    getOrCreateDirectConversationHandler,
    getConversationMessagesHandler,
    sendMessageHandler,
    uploadChatFileHandler,
    markReadHandler,
    getChatUnreadCountHandler
};
