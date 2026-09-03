const { Server } = require('socket.io');
const {
    saveMessage,
    getConversationParticipants,
    markConversationRead
} = require('../model/admin/chatModel');

let io = null;
// Map of userId -> Set of socket IDs (to support multiple tabs/devices)
const onlineUsers = new Map();

function initSocketServer(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
        },
        maxHttpBufferSize: 1e8 // 100MB buffer for file transfers
    });

    io.on('connection', (socket) => {
        let currentUserId = null;

        // 1. User Authentication & Registration
        socket.on('register_user', (userData) => {
            if (!userData || !userData.id) return;
            currentUserId = parseInt(userData.id);

            if (!onlineUsers.has(currentUserId)) {
                onlineUsers.set(currentUserId, new Set());
            }
            onlineUsers.get(currentUserId).add(socket.id);

            // Join personal user room (e.g. user_1, user_2) for private notifications
            socket.join(`user_${currentUserId}`);

            // Broadcast current online user IDs
            broadcastOnlineUsers();
        });

        // 2. Join a Conversation Room
        socket.on('join_conversation', ({ conversation_id, user_id }) => {
            if (!conversation_id) return;
            const roomName = `conversation_${conversation_id}`;
            socket.join(roomName);

            // Mark as read when entering
            if (user_id) {
                markConversationRead(conversation_id, user_id).catch(() => {});
            }
        });

        // 3. Leave a Conversation Room
        socket.on('leave_conversation', ({ conversation_id }) => {
            if (!conversation_id) return;
            socket.leave(`conversation_${conversation_id}`);
        });

        // 4. Send Message (Text, Emoji, File)
        socket.on('send_message', async (data, callback) => {
            try {
                const { conversation_id, sender_id, message, message_type, file_url, file_name, file_size, file_type } = data;

                if (!conversation_id || !sender_id) {
                    if (callback) callback({ status: false, msg: 'Invalid conversation or sender.' });
                    return;
                }

                // Save message to MySQL database
                const savedMessage = await saveMessage(conversation_id, sender_id, {
                    message,
                    message_type: message_type || 'text',
                    file_url,
                    file_name,
                    file_size,
                    file_type
                });

                const roomName = `conversation_${conversation_id}`;

                // Broadcast message to everyone currently in the conversation room
                io.to(roomName).emit('receive_message', savedMessage);

                // Notify all participants about conversation update (for sidebar preview and unread counters)
                const participantIds = await getConversationParticipants(conversation_id);
                participantIds.forEach(pId => {
                    io.to(`user_${pId}`).emit('conversation_updated', {
                        conversation_id,
                        last_message: savedMessage.message_type === 'image' ? '📷 Image attachment' : (savedMessage.message_type === 'file' ? `📎 ${savedMessage.file_name}` : (savedMessage.message || '')),
                        last_message_at: savedMessage.created_at,
                        last_sender_id: sender_id,
                        sender_first_name: savedMessage.sender_first_name,
                        message: savedMessage
                    });

                    // For recipients (not sender): send real-time notification alert and update unread count
                    if (pId !== parseInt(sender_id)) {
                        io.to(`user_${pId}`).emit('chat_notification', {
                            id: savedMessage.id,
                            conversation_id,
                            sender_id,
                            sender_name: `${savedMessage.sender_first_name || 'Staff'} ${savedMessage.sender_last_name || ''}`.trim(),
                            message: savedMessage.message_type === 'image' ? '📷 Sent an image' : (savedMessage.message_type === 'file' ? `📎 Sent a file: ${savedMessage.file_name}` : (savedMessage.message || '')),
                            created_at: savedMessage.created_at
                        });
                        emitChatUnreadCount(pId);
                    }
                });

                if (callback) callback({ status: true, message: savedMessage });
            } catch (err) {
                console.error('[Socket] Error saving message:', err);
                if (callback) callback({ status: false, msg: err.message });
            }
        });

        // 5. Typing Indicators
        socket.on('typing_start', ({ conversation_id, user_id, user_name }) => {
            if (!conversation_id) return;
            socket.to(`conversation_${conversation_id}`).emit('user_typing', {
                conversation_id,
                user_id,
                user_name
            });
        });

        socket.on('typing_stop', ({ conversation_id, user_id }) => {
            if (!conversation_id) return;
            socket.to(`conversation_${conversation_id}`).emit('user_stopped_typing', {
                conversation_id,
                user_id
            });
        });

        // 6. Mark Conversation Read
        socket.on('mark_read', async ({ conversation_id, user_id }) => {
            if (!conversation_id || !user_id) return;
            try {
                await markConversationRead(conversation_id, user_id);
                socket.to(`conversation_${conversation_id}`).emit('messages_read', {
                    conversation_id,
                    user_id
                });
                emitChatUnreadCount(user_id);
            } catch (err) {
                console.error('[Socket] mark_read error:', err);
            }
        });

        // 7. Disconnect Handler
        socket.on('disconnect', () => {
            if (currentUserId && onlineUsers.has(currentUserId)) {
                const userSockets = onlineUsers.get(currentUserId);
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(currentUserId);
                }
            }
            broadcastOnlineUsers();
        });
    });

    console.log('[Socket] Socket.io server initialized successfully!');
}

function broadcastOnlineUsers() {
    if (!io) return;
    const onlineIds = Array.from(onlineUsers.keys());
    io.emit('online_users', onlineIds);
}

/**
 * Broadcast Notice Notification to ALL Admin Users
 */
function broadcastNoticeNotification(noticeData) {
    if (!io) return;
    io.emit('notice_notification', {
        id: noticeData.id,
        title: noticeData.title,
        type: noticeData.notice_type || noticeData.type || 'general',
        category: noticeData.category || 'General',
        priority: noticeData.priority || 'high',
        created_by_name: noticeData.created_by_name || 'Super Admin',
        created_at: new Date().toISOString(),
        message: `📢 New Notice: "${noticeData.title}"`
    });
    io.emit('notice_count_updated', { delta: 1 });
    console.log(`[Socket] Broadcasted notice_notification and notice_count_updated for notice #${noticeData.id}`);
}

/**
 * Send Task Notification ONLY to the Assigned Admin / Employee User
 */
function sendTaskNotification(assignedToUserId, taskData) {
    if (!io || !assignedToUserId) return;
    const targetUserId = parseInt(assignedToUserId);
    const targetRoom = `user_${targetUserId}`;

    const pool = require('../Connection');
    const countSql = `
        SELECT COUNT(*) as unread_count 
        FROM crm_tasks 
        WHERE assigned_to = ? AND status NOT IN ('completed', 'cancelled')
        AND (SELECT COUNT(*) FROM crm_task_reads tr WHERE tr.task_id = crm_tasks.id AND tr.user_id = ?) = 0
    `;

    pool.query(countSql, [targetUserId, targetUserId], (err, rows) => {
        const unreadCount = rows && rows[0] ? (parseInt(rows[0].unread_count) || 1) : 1;

        const payload = {
            id: taskData.id,
            title: taskData.title,
            priority: taskData.priority || 'medium',
            assigned_to: targetUserId,
            assigned_by_name: taskData.assigned_by_name || 'Admin',
            lead_name: taskData.lead_name || null,
            created_at: new Date().toISOString(),
            active_task_count: unreadCount,
            unread_task_count: unreadCount,
            message: `📋 New Task Assigned: "${taskData.title}"`
        };

        io.to(targetRoom).emit('task_notification', payload);
        io.to(targetRoom).emit('task_count_updated', {
            user_id: targetUserId,
            count: unreadCount
        });

        console.log(`[Socket] Dispatched task_notification and unread count (${unreadCount}) to user room: ${targetRoom}`);
    });
}

/**
 * Emit Task Count Update to user's personal room
 */
function emitTaskCountUpdate(userId) {
    if (!io || !userId) return;
    const targetUserId = parseInt(userId);
    const targetRoom = `user_${targetUserId}`;

    const pool = require('../Connection');
    const countSql = `
        SELECT COUNT(*) as unread_count 
        FROM crm_tasks 
        WHERE assigned_to = ? AND status NOT IN ('completed', 'cancelled')
        AND (SELECT COUNT(*) FROM crm_task_reads tr WHERE tr.task_id = crm_tasks.id AND tr.user_id = ?) = 0
    `;

    pool.query(countSql, [targetUserId, targetUserId], (err, rows) => {
        if (!err && rows && rows[0]) {
            const unreadCount = parseInt(rows[0].unread_count) || 0;
            io.to(targetRoom).emit('task_count_updated', {
                user_id: targetUserId,
                count: unreadCount
            });
            console.log(`[Socket] Dispatched task_count_updated (${unreadCount}) to user room: ${targetRoom}`);
        }
    });
}

/**
 * Emit Unread Chat Messages Count to a Specific User
 */
async function emitChatUnreadCount(userId) {
    if (!io || !userId) return;
    const targetUserId = parseInt(userId);
    try {
        const { getChatUnreadCount } = require('../model/admin/chatModel');
        const unreadCount = await getChatUnreadCount(targetUserId);
        io.to(`user_${targetUserId}`).emit('chat_count_updated', {
            user_id: targetUserId,
            unread_count: unreadCount
        });
        console.log(`[Socket] Dispatched chat_count_updated (${unreadCount}) to user_${targetUserId}`);
    } catch (err) {
        console.error(`[Socket] Error emitting chat count for user ${targetUserId}:`, err);
    }
}

function getIO() {
    return io;
}

module.exports = {
    initSocketServer,
    broadcastNoticeNotification,
    sendTaskNotification,
    emitTaskCountUpdate,
    emitChatUnreadCount,
    getIO
};
