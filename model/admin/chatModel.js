const connection = require('../../Connection');

/**
 * Auto-initialize Chat Tables
 */
function initChatTables() {
    const createConversationsTable = `
        CREATE TABLE IF NOT EXISTS crm_chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
            title VARCHAR(255) NULL,
            created_by INT NOT NULL,
            last_message TEXT NULL,
            last_message_at DATETIME NULL,
            last_message_sender_id INT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_type (type),
            INDEX idx_last_message_at (last_message_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createParticipantsTable = `
        CREATE TABLE IF NOT EXISTS crm_chat_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            user_id INT NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_conv_user (conversation_id, user_id),
            INDEX idx_conv (conversation_id),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS crm_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            message_type ENUM('text', 'image', 'file', 'emoji', 'system') NOT NULL DEFAULT 'text',
            message TEXT NULL,
            file_url VARCHAR(255) NULL,
            file_name VARCHAR(255) NULL,
            file_size VARCHAR(50) NULL,
            file_type VARCHAR(50) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation_id (conversation_id),
            INDEX idx_sender_id (sender_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createConversationsTable, (err) => {
        if (err) console.error('[ChatModel] Error creating crm_chat_conversations table:', err);
    });

    connection.query(createParticipantsTable, (err) => {
        if (err) console.error('[ChatModel] Error creating crm_chat_participants table:', err);
    });

    connection.query(createMessagesTable, (err) => {
        if (err) console.error('[ChatModel] Error creating crm_chat_messages table:', err);
        else {
            // Ensure the default Team Group Hub exists
            ensureTeamHubExists();
        }
    });
}

/**
 * Ensure default Team Hub Channel exists and all active admin users are joined
 */
function ensureTeamHubExists() {
    const checkSql = `SELECT id FROM crm_chat_conversations WHERE type = 'group' AND title = 'Delta Safari Team Hub' LIMIT 1`;
    connection.query(checkSql, (err, rows) => {
        if (err) return;
        if (rows && rows.length > 0) {
            const teamHubId = rows[0].id;
            syncTeamHubParticipants(teamHubId);
        } else {
            const insertGroupSql = `
                INSERT INTO crm_chat_conversations (type, title, created_by, last_message, last_message_at)
                VALUES ('group', 'Delta Safari Team Hub', 1, 'Welcome to the official Delta Safari team chat channel! 👋', NOW())
            `;
            connection.query(insertGroupSql, (gErr, gRes) => {
                if (gErr) return;
                const teamHubId = gRes.insertId;
                // Add initial welcome message
                const msgSql = `
                    INSERT INTO crm_chat_messages (conversation_id, sender_id, message_type, message)
                    VALUES (?, 1, 'system', 'Welcome to Delta Safari Team Hub! Collaborate, share files, and communicate in real-time. 🐅✨')
                `;
                connection.query(msgSql, [teamHubId]);
                syncTeamHubParticipants(teamHubId);
            });
        }
    });
}

/**
 * Sync all active admin users into Team Hub group
 */
function syncTeamHubParticipants(teamHubId) {
    const usersSql = `SELECT id FROM user_master WHERE status = 1 AND (admin = 1 OR admin = 2)`;
    connection.query(usersSql, (uErr, users) => {
        if (uErr || !users) return;
        users.forEach(u => {
            const addSql = `INSERT IGNORE INTO crm_chat_participants (conversation_id, user_id) VALUES (?, ?)`;
            connection.query(addSql, [teamHubId, u.id]);
        });
    });
}

// Auto-init on load
initChatTables();

/**
 * Get or Create Direct 1-on-1 Conversation
 */
function getOrCreateDirectConversation(userId1, userId2) {
    return new Promise((resolve, reject) => {
        const u1 = parseInt(userId1);
        const u2 = parseInt(userId2);

        if (u1 === u2) {
            return reject(new Error("Cannot create conversation with yourself."));
        }

        // Find existing direct conversation with both participants
        const findSql = `
            SELECT c.id
            FROM crm_chat_conversations c
            JOIN crm_chat_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ?
            JOIN crm_chat_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ?
            WHERE c.type = 'direct'
            LIMIT 1
        `;

        connection.query(findSql, [u1, u2], (err, rows) => {
            if (err) return reject(err);
            if (rows && rows.length > 0) {
                return resolve(rows[0].id);
            }

            // Create new direct conversation
            const createSql = `
                INSERT INTO crm_chat_conversations (type, created_by, last_message, last_message_at)
                VALUES ('direct', ?, 'Conversation started', NOW())
            `;

            connection.query(createSql, [u1], (cErr, cRes) => {
                if (cErr) return reject(cErr);
                const conversationId = cRes.insertId;

                const addPartSql = `
                    INSERT INTO crm_chat_participants (conversation_id, user_id)
                    VALUES (?, ?), (?, ?)
                `;

                connection.query(addPartSql, [conversationId, u1, conversationId, u2], (pErr) => {
                    if (pErr) return reject(pErr);
                    resolve(conversationId);
                });
            });
        });
    });
}

/**
 * Get All Admin Users for Chat (Direct Chat Directory)
 */
function getAdminUsersForChat(currentUserId) {
    return new Promise((resolve, reject) => {
        const userId = parseInt(currentUserId);

        const sql = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.admin,
                u.status,
                (
                    SELECT c.id
                    FROM crm_chat_conversations c
                    JOIN crm_chat_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ?
                    JOIN crm_chat_participants p2 ON p2.conversation_id = c.id AND p2.user_id = u.id
                    WHERE c.type = 'direct'
                    LIMIT 1
                ) as conversation_id,
                (
                    SELECT COUNT(*)
                    FROM crm_chat_messages m
                    JOIN crm_chat_conversations c ON c.id = m.conversation_id
                    JOIN crm_chat_participants p_me ON p_me.conversation_id = c.id AND p_me.user_id = ?
                    JOIN crm_chat_participants p_other ON p_other.conversation_id = c.id AND p_other.user_id = u.id
                    WHERE c.type = 'direct' AND m.sender_id = u.id AND m.created_at > COALESCE(p_me.last_read_at, '2000-01-01')
                ) as unread_count
            FROM user_master u
            WHERE u.status = 1 AND (u.admin = 1 OR u.admin = 2) AND u.id != ?
            ORDER BY u.admin ASC, u.first_name ASC
        `;

        connection.query(sql, [userId, userId, userId], (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Get All Conversations for Logged In User
 * Returns:
 * 1. Delta Safari Team Hub (Group Channel)
 * 2. ALL Active Admin Users (Direct conversations list with each admin & admin user)
 */
function getUserConversations(currentUserId) {
    return new Promise((resolve, reject) => {
        const userId = parseInt(currentUserId);

        // Make sure Team Hub is synced
        ensureTeamHubExists();

        const sql = `
            -- 1. Delta Safari Team Hub Group
            SELECT 
                c.id,
                'group' as type,
                c.title,
                c.last_message,
                c.last_message_at,
                c.last_message_sender_id,
                c.created_at,
                p.last_read_at,
                (
                    SELECT COUNT(*) 
                    FROM crm_chat_messages m 
                    WHERE m.conversation_id = c.id 
                      AND m.sender_id != ? 
                      AND m.created_at > COALESCE(p.last_read_at, '2000-01-01')
                ) as unread_count,
                NULL as other_user_id,
                NULL as other_user_first_name,
                NULL as other_user_last_name,
                NULL as other_user_email,
                NULL as other_user_phone,
                NULL as other_user_role,
                sender_u.first_name as last_sender_first_name,
                1 as is_team_hub
            FROM crm_chat_conversations c
            LEFT JOIN crm_chat_participants p ON p.conversation_id = c.id AND p.user_id = ?
            LEFT JOIN user_master sender_u ON sender_u.id = c.last_message_sender_id
            WHERE c.type = 'group' AND c.title = 'Delta Safari Team Hub'

            UNION ALL

            -- 2. All Active Admin Users (Super Admin + Regular Staff)
            SELECT 
                COALESCE(c.id, 0) as id,
                'direct' as type,
                NULL as title,
                c.last_message,
                c.last_message_at,
                c.last_message_sender_id,
                c.created_at,
                p.last_read_at,
                (
                    SELECT COUNT(*) 
                    FROM crm_chat_messages m 
                    WHERE m.conversation_id = c.id 
                      AND m.sender_id = u.id 
                      AND m.created_at > COALESCE(p.last_read_at, '2000-01-01')
                ) as unread_count,
                u.id as other_user_id,
                u.first_name as other_user_first_name,
                u.last_name as other_user_last_name,
                u.email as other_user_email,
                u.phone as other_user_phone,
                u.admin as other_user_role,
                sender_u.first_name as last_sender_first_name,
                0 as is_team_hub
            FROM user_master u
            LEFT JOIN crm_chat_participants p2 ON p2.user_id = u.id
            LEFT JOIN crm_chat_conversations c ON c.id = p2.conversation_id AND c.type = 'direct' AND EXISTS (
                SELECT 1 FROM crm_chat_participants p1 WHERE p1.conversation_id = c.id AND p1.user_id = ?
            )
            LEFT JOIN crm_chat_participants p ON p.conversation_id = c.id AND p.user_id = ?
            LEFT JOIN user_master sender_u ON sender_u.id = c.last_message_sender_id
            WHERE u.status = 1 AND (u.admin = 1 OR u.admin = 2) AND u.id != ?
            ORDER BY is_team_hub DESC, COALESCE(last_message_at, '2000-01-01') DESC, other_user_role ASC, other_user_first_name ASC
        `;

        connection.query(sql, [userId, userId, userId, userId, userId], (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Get Messages for a Conversation & Mark Read
 */
function getConversationMessages(conversationId, currentUserId, limit = 100) {
    return new Promise((resolve, reject) => {
        const convId = parseInt(conversationId);
        const userId = parseInt(currentUserId);

        // Mark as read for this user
        const markReadSql = `
            UPDATE crm_chat_participants 
            SET last_read_at = NOW() 
            WHERE conversation_id = ? AND user_id = ?
        `;
        connection.query(markReadSql, [convId, userId]);

        const sql = `
            SELECT 
                m.*,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name,
                u.email as sender_email,
                u.admin as sender_role
            FROM crm_chat_messages m
            LEFT JOIN user_master u ON u.id = m.sender_id
            WHERE m.conversation_id = ?
            ORDER BY m.id ASC
            LIMIT ?
        `;

        connection.query(sql, [convId, parseInt(limit)], (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Save New Message
 */
function saveMessage(conversationId, senderId, messageData) {
    return new Promise((resolve, reject) => {
        const convId = parseInt(conversationId);
        const sId = parseInt(senderId);

        const insertSql = `
            INSERT INTO crm_chat_messages (
                conversation_id,
                sender_id,
                message_type,
                message,
                file_url,
                file_name,
                file_size,
                file_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const msgType = messageData.message_type || (messageData.file_url ? (messageData.file_type?.startsWith('image/') ? 'image' : 'file') : 'text');
        const textContent = messageData.message ? messageData.message.trim() : null;

        connection.query(insertSql, [
            convId,
            sId,
            msgType,
            textContent,
            messageData.file_url || null,
            messageData.file_name || null,
            messageData.file_size || null,
            messageData.file_type || null
        ], (err, result) => {
            if (err) return reject(err);
            const messageId = result.insertId;

            // Summary for conversation preview
            const previewText = msgType === 'image' ? '📷 Image attachment' : (msgType === 'file' ? `📎 ${messageData.file_name || 'File'}` : (textContent || 'New message'));

            const updateConvSql = `
                UPDATE crm_chat_conversations 
                SET last_message = ?, last_message_at = NOW(), last_message_sender_id = ?
                WHERE id = ?
            `;
            connection.query(updateConvSql, [previewText, sId, convId]);

            // Update sender's last read timestamp so they don't see unread count for their own message
            const readSenderSql = `
                UPDATE crm_chat_participants 
                SET last_read_at = NOW() 
                WHERE conversation_id = ? AND user_id = ?
            `;
            connection.query(readSenderSql, [convId, sId]);

            // Fetch the full saved message with sender details
            const fetchSql = `
                SELECT 
                    m.*,
                    u.first_name as sender_first_name,
                    u.last_name as sender_last_name,
                    u.email as sender_email,
                    u.admin as sender_role
                FROM crm_chat_messages m
                LEFT JOIN user_master u ON u.id = m.sender_id
                WHERE m.id = ?
            `;

            connection.query(fetchSql, [messageId], (fErr, rows) => {
                if (fErr) return reject(fErr);
                resolve(JSON.parse(JSON.stringify(rows[0])));
            });
        });
    });
}

/**
 * Mark Conversation as Read
 */
function markConversationRead(conversationId, currentUserId) {
    return new Promise((resolve, reject) => {
        const convId = parseInt(conversationId);
        const userId = parseInt(currentUserId);

        const sql = `
            UPDATE crm_chat_participants 
            SET last_read_at = NOW() 
            WHERE conversation_id = ? AND user_id = ?
        `;

        connection.query(sql, [convId, userId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

/**
 * Get Participant User IDs for a conversation (for Socket.io emit targets)
 */
function getConversationParticipants(conversationId) {
    return new Promise((resolve, reject) => {
        const convId = parseInt(conversationId);
        const sql = `SELECT user_id FROM crm_chat_participants WHERE conversation_id = ?`;
        connection.query(sql, [convId], (err, rows) => {
            if (err) return reject(err);
            resolve((rows || []).map(r => r.user_id));
        });
    });
}

module.exports = {
    initChatTables,
    getOrCreateDirectConversation,
    getAdminUsersForChat,
    getUserConversations,
    getConversationMessages,
    saveMessage,
    markConversationRead,
    getConversationParticipants
};
