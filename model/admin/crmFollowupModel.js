const connection = require('../../Connection');

/**
 * Auto-initialize CRM Follow-up Tables
 */
function initCrmFollowupTables() {
    const createFollowupsTable = `
        CREATE TABLE IF NOT EXISTS crm_lead_followups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact_id INT NOT NULL UNIQUE,
            lead_name VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            email VARCHAR(100) NULL,
            lead_type ENUM('cold', 'warm', 'hot') NOT NULL DEFAULT 'warm',
            travel_date DATE NULL,
            travel_destination VARCHAR(255) NULL,
            number_of_persons INT DEFAULT 1,
            total_rooms INT DEFAULT 1,
            extra_note TEXT NULL,
            next_followup_date DATE NULL,
            last_followup_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_followup_by INT NULL,
            created_by INT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_contact_id (contact_id),
            INDEX idx_lead_type (lead_type),
            INDEX idx_next_followup_date (next_followup_date),
            INDEX idx_travel_date (travel_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createFollowupLogsTable = `
        CREATE TABLE IF NOT EXISTS crm_lead_followup_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            followup_id INT NULL,
            contact_id INT NOT NULL,
            admin_user_id INT NOT NULL,
            lead_type VARCHAR(50) NOT NULL,
            note TEXT NULL,
            next_followup_date DATE NULL,
            travel_date DATE NULL,
            travel_destination VARCHAR(255) NULL,
            number_of_persons INT DEFAULT 1,
            total_rooms INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_log_contact (contact_id),
            INDEX idx_log_admin (admin_user_id),
            INDEX idx_log_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createFollowupsTable, (err) => {
        if (err) console.error("[CRM Follow-up] Error creating crm_lead_followups table:", err.message);
    });

    connection.query(createFollowupLogsTable, (err) => {
        if (err) console.error("[CRM Follow-up] Error creating crm_lead_followup_logs table:", err.message);
    });
}

// Initialize tables on load
initCrmFollowupTables();

/**
 * Format a date object/string to YYYY-MM-DD or null
 */
function formatDateForDb(dateInput) {
    if (!dateInput) return null;
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

/**
 * Save or Update Lead Follow-up and create an audit timeline log
 */
function saveLeadFollowupModel({
    contact_id,
    lead_name = '',
    phone = '',
    email = '',
    lead_type = 'warm',
    travel_date = null,
    travel_destination = '',
    number_of_persons = 1,
    total_rooms = 1,
    extra_note = '',
    next_followup_date = null,
    admin_user_id
}) {
    return new Promise(async (resolve, reject) => {
        if (!contact_id) {
            return reject(new Error("Contact ID is required."));
        }
        if (!admin_user_id) {
            return reject(new Error("Admin User ID is required."));
        }

        const validLeadTypes = ['cold', 'warm', 'hot'];
        const normalizedLeadType = validLeadTypes.includes(String(lead_type).toLowerCase()) 
            ? String(lead_type).toLowerCase() 
            : 'warm';

        const formattedTravelDate = formatDateForDb(travel_date);
        const formattedNextFollowupDate = formatDateForDb(next_followup_date);
        const parsedPersons = Math.max(1, parseInt(number_of_persons) || 1);
        const parsedRooms = Math.max(1, parseInt(total_rooms) || 1);

        try {
            // 1. Check if contact exists
            const contactRows = await new Promise((res, rej) => {
                connection.query(`SELECT id, wa_id, name, assigned_to FROM whatsapp_contacts WHERE id = ? LIMIT 1`, [contact_id], (err, rows) => {
                    if (err) return rej(err);
                    res(rows || []);
                });
            });

            if (contactRows.length === 0) {
                return reject(new Error("WhatsApp Contact not found."));
            }

            const currentContact = contactRows[0];
            const finalPhone = (phone && phone.trim()) || currentContact.wa_id;
            const finalName = (lead_name && lead_name.trim()) || currentContact.name || `Lead ${currentContact.wa_id}`;

            // 2. Check if follow-up record already exists
            const existingFollowupRows = await new Promise((res, rej) => {
                connection.query(`SELECT id FROM crm_lead_followups WHERE contact_id = ? LIMIT 1`, [contact_id], (err, rows) => {
                    if (err) return rej(err);
                    res(rows || []);
                });
            });

            let followupId = null;

            if (existingFollowupRows.length > 0) {
                // Update existing follow-up
                followupId = existingFollowupRows[0].id;
                const updateSql = `
                    UPDATE crm_lead_followups 
                    SET 
                        lead_name = ?,
                        phone = ?,
                        email = ?,
                        lead_type = ?,
                        travel_date = ?,
                        travel_destination = ?,
                        number_of_persons = ?,
                        total_rooms = ?,
                        extra_note = ?,
                        next_followup_date = ?,
                        last_followup_at = NOW(),
                        last_followup_by = ?
                    WHERE id = ?
                `;
                await new Promise((res, rej) => {
                    connection.query(updateSql, [
                        finalName,
                        finalPhone,
                        email ? email.trim() : null,
                        normalizedLeadType,
                        formattedTravelDate,
                        travel_destination ? travel_destination.trim() : '',
                        parsedPersons,
                        parsedRooms,
                        extra_note ? extra_note.trim() : '',
                        formattedNextFollowupDate,
                        admin_user_id,
                        followupId
                    ], (err, result) => {
                        if (err) return rej(err);
                        res(result);
                    });
                });
            } else {
                // Insert new follow-up
                const insertSql = `
                    INSERT INTO crm_lead_followups (
                        contact_id,
                        lead_name,
                        phone,
                        email,
                        lead_type,
                        travel_date,
                        travel_destination,
                        number_of_persons,
                        total_rooms,
                        extra_note,
                        next_followup_date,
                        last_followup_at,
                        last_followup_by,
                        created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
                `;
                const insertResult = await new Promise((res, rej) => {
                    connection.query(insertSql, [
                        contact_id,
                        finalName,
                        finalPhone,
                        email ? email.trim() : null,
                        normalizedLeadType,
                        formattedTravelDate,
                        travel_destination ? travel_destination.trim() : '',
                        parsedPersons,
                        parsedRooms,
                        extra_note ? extra_note.trim() : '',
                        formattedNextFollowupDate,
                        admin_user_id,
                        admin_user_id
                    ], (err, result) => {
                        if (err) return rej(err);
                        res(result);
                    });
                });
                followupId = insertResult.insertId;
            }

            // 3. Create Audit Timeline Log
            const insertLogSql = `
                INSERT INTO crm_lead_followup_logs (
                    followup_id,
                    contact_id,
                    admin_user_id,
                    lead_type,
                    note,
                    next_followup_date,
                    travel_date,
                    travel_destination,
                    number_of_persons,
                    total_rooms,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            await new Promise((res, rej) => {
                connection.query(insertLogSql, [
                    followupId,
                    contact_id,
                    admin_user_id,
                    normalizedLeadType,
                    extra_note ? extra_note.trim() : 'Follow-up updated',
                    formattedNextFollowupDate,
                    formattedTravelDate,
                    travel_destination ? travel_destination.trim() : '',
                    parsedPersons,
                    parsedRooms
                ], (err, result) => {
                    if (err) return rej(err);
                    res(result);
                });
            });

            // 4. Update contact name if provided
            if (lead_name && lead_name.trim()) {
                connection.query(`UPDATE whatsapp_contacts SET name = ? WHERE id = ?`, [lead_name.trim(), contact_id], () => {});
            }

            resolve({
                success: true,
                followup_id: followupId,
                contact_id: contact_id,
                lead_type: normalizedLeadType,
                next_followup_date: formattedNextFollowupDate
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get Paginated List of Lead Follow-ups with advanced filtering
 */
function getFollowupsListModel({
    page = 1,
    limit = 25,
    search = '',
    lead_type = '',
    is_today_only = false,
    from_date = '',
    to_date = '',
    date_filter_type = 'next_followup', // 'next_followup' or 'travel_date' or 'last_followup'
    assigned_to = '',
    requestingUser = null
} = {}) {
    return new Promise((resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let conditions = [];
        let params = [];

        // 1. Role-based isolation
        if (!isSuperAdmin) {
            conditions.push(`c.assigned_to = ?`);
            params.push(currentUserId);
        } else if (assigned_to) {
            if (assigned_to === 'unassigned') {
                conditions.push(`c.assigned_to IS NULL`);
            } else if (!isNaN(Number(assigned_to))) {
                conditions.push(`c.assigned_to = ?`);
                params.push(Number(assigned_to));
            }
        }

        // 2. Lead Type filter (hot, warm, cold)
        if (lead_type && ['hot', 'warm', 'cold'].includes(String(lead_type).toLowerCase())) {
            conditions.push(`f.lead_type = ?`);
            params.push(String(lead_type).toLowerCase());
        }

        // 3. Quick Today Filter
        if (String(is_today_only) === 'true' || is_today_only === true) {
            conditions.push(`f.next_followup_date = CURDATE()`);
        }

        // 4. Date range filter (from_date to to_date)
        const targetDateField = date_filter_type === 'travel_date' 
            ? 'f.travel_date' 
            : (date_filter_type === 'last_followup' ? 'DATE(f.last_followup_at)' : 'f.next_followup_date');

        if (from_date && to_date) {
            const formattedFrom = formatDateForDb(from_date);
            const formattedTo = formatDateForDb(to_date);
            if (formattedFrom && formattedTo) {
                conditions.push(`${targetDateField} BETWEEN ? AND ?`);
                params.push(formattedFrom, formattedTo);
            }
        } else if (from_date) {
            const formattedFrom = formatDateForDb(from_date);
            if (formattedFrom) {
                conditions.push(`${targetDateField} >= ?`);
                params.push(formattedFrom);
            }
        } else if (to_date) {
            const formattedTo = formatDateForDb(to_date);
            if (formattedTo) {
                conditions.push(`${targetDateField} <= ?`);
                params.push(formattedTo);
            }
        }

        // 5. Search filter (Lead Name, Phone, Destination, Notes)
        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push(`(
                f.lead_name LIKE ? 
                OR c.name LIKE ? 
                OR f.phone LIKE ? 
                OR c.wa_id LIKE ? 
                OR f.travel_destination LIKE ? 
                OR f.extra_note LIKE ?
            )`);
            params.push(term, term, term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                f.id AS followup_id,
                f.contact_id,
                COALESCE(NULLIF(f.lead_name, ''), c.name, 'WhatsApp Customer') AS lead_name,
                COALESCE(NULLIF(f.phone, ''), c.wa_id) AS phone,
                f.email,
                f.lead_type,
                f.travel_date,
                f.travel_destination,
                f.number_of_persons,
                f.total_rooms,
                f.extra_note,
                f.next_followup_date,
                f.last_followup_at,
                f.created_at AS followup_created_at,
                f.updated_at AS followup_updated_at,
                c.wa_id,
                c.assigned_to,
                c.assigned_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_user_name,
                u.email AS assigned_user_email,
                CONCAT(ub.first_name, ' ', COALESCE(ub.last_name, '')) AS last_followup_by_name,
                (
                    SELECT COUNT(l.id) 
                    FROM crm_lead_followup_logs l 
                    WHERE l.contact_id = f.contact_id
                ) AS total_followup_logs,
                (
                    SELECT m.message_text 
                    FROM whatsapp_messages m 
                    WHERE m.contact_id = f.contact_id 
                    ORDER BY m.id DESC 
                    LIMIT 1
                ) AS last_chat_message,
                (
                    SELECT m.created_at 
                    FROM whatsapp_messages m 
                    WHERE m.contact_id = f.contact_id 
                    ORDER BY m.id DESC 
                    LIMIT 1
                ) AS last_chat_time
            FROM crm_lead_followups f
            JOIN whatsapp_contacts c ON c.id = f.contact_id
            LEFT JOIN user_master u ON u.id = c.assigned_to
            LEFT JOIN user_master ub ON ub.id = f.last_followup_by
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN f.next_followup_date = CURDATE() THEN 1
                    WHEN f.next_followup_date < CURDATE() THEN 2
                    WHEN f.next_followup_date > CURDATE() THEN 3
                    ELSE 4
                END ASC,
                f.next_followup_date ASC,
                f.last_followup_at DESC
            LIMIT ? OFFSET ?
        `;

        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.max(1, parseInt(limit) || 25);
        const offset = (parsedPage - 1) * parsedLimit;

        const queryParams = [...params, parsedLimit, offset];

        connection.query(sql, queryParams, (err, rows) => {
            if (err) return reject(err);

            const countSql = `
                SELECT COUNT(DISTINCT f.id) AS total
                FROM crm_lead_followups f
                JOIN whatsapp_contacts c ON c.id = f.contact_id
                ${whereClause}
            `;

            connection.query(countSql, params, (cErr, cRows) => {
                const total = (!cErr && cRows && cRows[0]) ? cRows[0].total : (rows ? rows.length : 0);
                resolve({
                    followups: rows ? JSON.parse(JSON.stringify(rows)) : [],
                    total,
                    page: parsedPage,
                    limit: parsedLimit,
                    totalPages: Math.ceil(total / parsedLimit)
                });
            });
        });
    });
}

/**
 * Get Follow-up Summary Statistics
 */
function getFollowupStatsModel(requestingUser = null) {
    return new Promise((resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let whereClause = '';
        let params = [];

        if (!isSuperAdmin) {
            whereClause = 'WHERE c.assigned_to = ?';
            params = [currentUserId];
        }

        const sql = `
            SELECT 
                COUNT(f.id) AS total_followups,
                SUM(CASE WHEN f.next_followup_date = CURDATE() THEN 1 ELSE 0 END) AS today_followups,
                SUM(CASE WHEN f.next_followup_date < CURDATE() AND f.next_followup_date IS NOT NULL THEN 1 ELSE 0 END) AS overdue_followups,
                SUM(CASE WHEN f.next_followup_date > CURDATE() THEN 1 ELSE 0 END) AS upcoming_followups,
                SUM(CASE WHEN f.lead_type = 'hot' THEN 1 ELSE 0 END) AS hot_leads,
                SUM(CASE WHEN f.lead_type = 'warm' THEN 1 ELSE 0 END) AS warm_leads,
                SUM(CASE WHEN f.lead_type = 'cold' THEN 1 ELSE 0 END) AS cold_leads
            FROM crm_lead_followups f
            JOIN whatsapp_contacts c ON c.id = f.contact_id
            ${whereClause}
        `;

        connection.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            const stats = rows && rows[0] ? rows[0] : {};
            resolve({
                total_followups: Number(stats.total_followups || 0),
                today_followups: Number(stats.today_followups || 0),
                overdue_followups: Number(stats.overdue_followups || 0),
                upcoming_followups: Number(stats.upcoming_followups || 0),
                hot_leads: Number(stats.hot_leads || 0),
                warm_leads: Number(stats.warm_leads || 0),
                cold_leads: Number(stats.cold_leads || 0)
            });
        });
    });
}

/**
 * Get Follow-up Timeline Logs for a Contact
 */
function getFollowupLogsHistoryModel(contactId, requestingUser = null) {
    return new Promise(async (resolve, reject) => {
        if (!contactId) return reject(new Error("Contact ID is required."));

        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        // Security check
        const contactRows = await new Promise((res) => {
            connection.query(`SELECT id, wa_id, name, assigned_to FROM whatsapp_contacts WHERE id = ? LIMIT 1`, [contactId], (err, rows) => {
                res(rows || []);
            });
        });

        if (contactRows.length === 0) {
            return resolve(null);
        }

        const contact = contactRows[0];
        if (!isSuperAdmin && contact.assigned_to !== currentUserId) {
            return resolve({ unauthorized: true });
        }

        const sql = `
            SELECT 
                l.id,
                l.followup_id,
                l.contact_id,
                l.admin_user_id,
                l.lead_type,
                l.note,
                l.next_followup_date,
                l.travel_date,
                l.travel_destination,
                l.number_of_persons,
                l.total_rooms,
                l.created_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS admin_name,
                u.email AS admin_email
            FROM crm_lead_followup_logs l
            LEFT JOIN user_master u ON u.id = l.admin_user_id
            WHERE l.contact_id = ?
            ORDER BY l.id DESC
        `;

        connection.query(sql, [contactId], (err, rows) => {
            if (err) return reject(err);
            resolve({
                contact: contact,
                logs: rows ? JSON.parse(JSON.stringify(rows)) : []
            });
        });
    });
}

/**
 * Get Single Lead Follow-up Record by Contact ID
 */
function getSingleLeadFollowupModel(contactId, requestingUser = null) {
    return new Promise(async (resolve, reject) => {
        if (!contactId) return reject(new Error("Contact ID is required."));

        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        const contactRows = await new Promise((res) => {
            connection.query(`
                SELECT 
                    c.id, 
                    c.wa_id, 
                    c.name, 
                    c.assigned_to, 
                    c.assigned_at,
                    CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_user_name,
                    u.email AS assigned_user_email
                FROM whatsapp_contacts c
                LEFT JOIN user_master u ON u.id = c.assigned_to
                WHERE c.id = ? 
                LIMIT 1
            `, [contactId], (err, rows) => {
                res(rows || []);
            });
        });

        if (contactRows.length === 0) {
            return resolve(null);
        }

        const contact = contactRows[0];
        if (!isSuperAdmin && contact.assigned_to !== currentUserId) {
            return resolve({ unauthorized: true });
        }

        const followupSql = `
            SELECT 
                f.*,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS last_followup_by_name,
                u.email AS last_followup_by_email
            FROM crm_lead_followups f
            LEFT JOIN user_master u ON u.id = f.last_followup_by
            WHERE f.contact_id = ?
            LIMIT 1
        `;

        connection.query(followupSql, [contactId], async (err, rows) => {
            if (err) return reject(err);
            const followup = rows && rows.length > 0 ? rows[0] : null;

            // Also fetch recent logs
            const logsData = await getFollowupLogsHistoryModel(contactId, requestingUser);

            resolve({
                contact: contact,
                followup: followup ? JSON.parse(JSON.stringify(followup)) : null,
                logs: logsData?.logs || []
            });
        });
    });
}

module.exports = {
    initCrmFollowupTables,
    saveLeadFollowupModel,
    getFollowupsListModel,
    getFollowupStatsModel,
    getFollowupLogsHistoryModel,
    getSingleLeadFollowupModel
};
