const connection = require('../../Connection');

/**
 * Auto-initialize Notice Board Tables
 */
function initNoticeTables() {
    const createNoticesTable = `
        CREATE TABLE IF NOT EXISTS crm_notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            notice_type ENUM('alert', 'important', 'announcement', 'operational', 'general') NOT NULL DEFAULT 'general',
            category VARCHAR(100) NOT NULL DEFAULT 'General',
            is_pinned TINYINT(1) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            expires_at DATE NULL,
            attachment_url VARCHAR(255) NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_is_pinned (is_pinned),
            INDEX idx_is_active (is_active),
            INDEX idx_notice_type (notice_type),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createReadsTable = `
        CREATE TABLE IF NOT EXISTS crm_notice_reads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            notice_id INT NOT NULL,
            user_id INT NOT NULL,
            read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_notice_user (notice_id, user_id),
            INDEX idx_notice_id (notice_id),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createNoticesTable, (err) => {
        if (err) console.error('[NoticeModel] Error creating crm_notices table:', err);
    });

    connection.query(createReadsTable, (err) => {
        if (err) console.error('[NoticeModel] Error creating crm_notice_reads table:', err);
    });
}

// Auto-init on load
initNoticeTables();

/**
 * Create a New Notice (Super Admin)
 */
function createNotice(data, creatorUserId) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO crm_notices (
                title,
                content,
                notice_type,
                category,
                is_pinned,
                is_active,
                expires_at,
                attachment_url,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(sql, [
            data.title.trim(),
            data.content.trim(),
            data.notice_type || 'general',
            data.category || 'General',
            data.is_pinned ? 1 : 0,
            data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
            data.expires_at || null,
            data.attachment_url || null,
            creatorUserId
        ], (err, result) => {
            if (err) return reject(err);
            resolve({ id: result.insertId, ...data });
        });
    });
}

/**
 * Get All Notices for Admin Users (Visible to All Admin Users)
 */
function getNoticesList(filters = {}, currentUser = {}) {
    return new Promise((resolve, reject) => {
        let whereClauses = ['n.is_active = 1'];
        let params = [];

        if (filters.notice_type && filters.notice_type !== 'all') {
            whereClauses.push('n.notice_type = ?');
            params.push(filters.notice_type);
        }

        if (filters.category && filters.category !== 'all') {
            whereClauses.push('n.category = ?');
            params.push(filters.category);
        }

        if (filters.search) {
            const searchTerm = `%${filters.search.trim()}%`;
            whereClauses.push('(n.title LIKE ? OR n.content LIKE ? OR n.category LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (filters.is_pinned !== undefined && filters.is_pinned !== '') {
            whereClauses.push('n.is_pinned = ?');
            params.push(filters.is_pinned === 'true' || filters.is_pinned === true ? 1 : 0);
        }

        // Check if expired notices should be hidden
        if (!filters.include_expired || filters.include_expired === 'false') {
            whereClauses.push('(n.expires_at IS NULL OR n.expires_at >= CURDATE())');
        }

        const userId = currentUser.id || 0;
        const whereSql = whereClauses.join(' AND ');

        const sql = `
            SELECT 
                n.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                u.email as author_email,
                u.admin as author_role,
                CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_read,
                (SELECT COUNT(*) FROM crm_notice_reads WHERE notice_id = n.id) as read_count
            FROM crm_notices n
            LEFT JOIN user_master u ON u.id = n.created_by
            LEFT JOIN crm_notice_reads nr ON nr.notice_id = n.id AND nr.user_id = ?
            WHERE ${whereSql}
            ORDER BY n.is_pinned DESC, n.id DESC
        `;

        connection.query(sql, [userId, ...params], (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Get Single Notice Details & Mark As Read
 */
function getNoticeById(noticeId, currentUser = {}) {
    return new Promise((resolve, reject) => {
        const userId = currentUser.id || 0;

        // Auto mark as read
        if (userId > 0) {
            const readSql = `INSERT IGNORE INTO crm_notice_reads (notice_id, user_id) VALUES (?, ?)`;
            connection.query(readSql, [noticeId, userId]);
        }

        const sql = `
            SELECT 
                n.*,
                u.first_name as author_first_name,
                u.last_name as author_last_name,
                u.email as author_email,
                u.admin as author_role,
                (SELECT COUNT(*) FROM crm_notice_reads WHERE notice_id = n.id) as read_count
            FROM crm_notices n
            LEFT JOIN user_master u ON u.id = n.created_by
            WHERE n.id = ?
        `;

        connection.query(sql, [noticeId], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(null);
            resolve(JSON.parse(JSON.stringify(rows[0])));
        });
    });
}

/**
 * Update Notice (Super Admin Only)
 */
function updateNotice(noticeId, data) {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE crm_notices SET
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                notice_type = COALESCE(?, notice_type),
                category = COALESCE(?, category),
                is_pinned = COALESCE(?, is_pinned),
                is_active = COALESCE(?, is_active),
                expires_at = ?,
                attachment_url = ?
            WHERE id = ?
        `;

        connection.query(sql, [
            data.title ? data.title.trim() : null,
            data.content ? data.content.trim() : null,
            data.notice_type || null,
            data.category || null,
            data.is_pinned !== undefined ? (data.is_pinned ? 1 : 0) : null,
            data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
            data.expires_at || null,
            data.attachment_url || null,
            noticeId
        ], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

/**
 * Toggle Pin Status
 */
function togglePinNotice(noticeId, isPinned) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE crm_notices SET is_pinned = ? WHERE id = ?`;
        connection.query(sql, [isPinned ? 1 : 0, noticeId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

/**
 * Delete Notice (Super Admin Only)
 */
function deleteNotice(noticeId) {
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM crm_notice_reads WHERE notice_id = ?`, [noticeId], () => {
            connection.query(`DELETE FROM crm_notices WHERE id = ?`, [noticeId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    });
}

/**
 * Get Notice Board Stats
 */
function getNoticeStats(currentUser = {}) {
    return new Promise((resolve, reject) => {
        const userId = currentUser.id || 0;
        const sql = `
            SELECT
                COUNT(*) as total_notices,
                SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned_count,
                SUM(CASE WHEN notice_type = 'alert' THEN 1 ELSE 0 END) as urgent_alerts_count,
                SUM(CASE WHEN notice_type = 'important' THEN 1 ELSE 0 END) as important_count,
                SUM(CASE WHEN (SELECT COUNT(*) FROM crm_notice_reads nr WHERE nr.notice_id = crm_notices.id AND nr.user_id = ?) = 0 THEN 1 ELSE 0 END) as unread_count
            FROM crm_notices
            WHERE is_active = 1 AND (expires_at IS NULL OR expires_at >= CURDATE())
        `;

        connection.query(sql, [userId], (err, rows) => {
            if (err) return reject(err);
            const stats = rows && rows[0] ? rows[0] : {};
            resolve({
                total_notices: parseInt(stats.total_notices || 0),
                pinned_count: parseInt(stats.pinned_count || 0),
                urgent_alerts_count: parseInt(stats.urgent_alerts_count || 0),
                important_count: parseInt(stats.important_count || 0),
                unread_count: parseInt(stats.unread_count || 0)
            });
        });
    });
}

module.exports = {
    initNoticeTables,
    createNotice,
    getNoticesList,
    getNoticeById,
    updateNotice,
    togglePinNotice,
    deleteNotice,
    getNoticeStats
};
