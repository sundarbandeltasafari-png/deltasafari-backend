const connection = require('../../Connection');

/**
 * Mask phone number for regular admin users (admin = 2) for privacy
 */
function maskPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    const clean = phone.trim();
    if (clean.length <= 4) return '****';
    const start = clean.slice(0, 4);
    const end = clean.slice(-2);
    return `${start}${'*'.repeat(Math.max(2, clean.length - 6))}${end}`;
}

/**
 * Automatically assign a lead to the next available active admin user using Round-Robin
 */
function autoAssignLeadToAdmin(contactId) {
    return new Promise((resolve) => {
        const querySql = `
            SELECT s.user_id, s.leads_count, s.last_assigned_at, u.first_name, u.last_name
            FROM crm_lead_distribution_settings s
            JOIN user_master u ON u.id = s.user_id
            WHERE s.is_active = 1 AND u.status = 1 AND u.admin = 2
            ORDER BY COALESCE(s.last_assigned_at, '2000-01-01 00:00:00') ASC, s.leads_count ASC, s.id ASC
            LIMIT 1
        `;
        connection.query(querySql, (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return resolve(null);
            }
            const selectedManager = rows[0];
            const assignSql = `UPDATE whatsapp_contacts SET assigned_to = ?, assigned_at = NOW() WHERE id = ? AND assigned_to IS NULL`;
            connection.query(assignSql, [selectedManager.user_id, contactId], (aErr) => {
                if (!aErr) {
                    const updateStatsSql = `
                        UPDATE crm_lead_distribution_settings 
                        SET leads_count = leads_count + 1, last_assigned_at = NOW() 
                        WHERE user_id = ?
                    `;
                    connection.query(updateStatsSql, [selectedManager.user_id], () => {});
                    console.log(`[CRM Lead Auto-Distributed]: Contact ID ${contactId} assigned to Admin User ID ${selectedManager.user_id} (${selectedManager.first_name} ${selectedManager.last_name})`);
                    resolve(selectedManager.user_id);
                } else {
                    resolve(null);
                }
            });
        });
    });
}

/**
 * Upsert Contact (Find or Create, Update Name if provided, Auto-Assign if new)
 * @param {string} waId - WhatsApp Phone ID / Number
 * @param {string} name - Contact Profile Name
 * @returns {Promise<{id: number, wa_id: string, name: string, is_new: boolean, assigned_to: number|null}>}
 */
function upsertWhatsAppContact(waId, name) {
    return new Promise((resolve, reject) => {
        if (!waId) return reject(new Error("WhatsApp ID (wa_id) is required."));

        const cleanWaId = String(waId).replace(/[^0-9]/g, '').trim() || String(waId).trim();
        const contactName = (name && String(name).trim() && String(name).trim() !== cleanWaId) ? String(name).trim() : `Lead ${cleanWaId}`;

        const selectSql = `SELECT id, wa_id, name, assigned_to, COALESCE(lead_source, 'whatsapp') AS lead_source FROM whatsapp_contacts WHERE wa_id = ? LIMIT 1`;
        connection.query(selectSql, [cleanWaId], (err, rows) => {
            if (err) return reject(err);

            if (rows && rows.length > 0) {
                const contact = rows[0];
                // Update name if currently empty or newly provided with real name
                if (contactName && contactName !== contact.name && contactName !== cleanWaId) {
                    const updateSql = `UPDATE whatsapp_contacts SET name = ?, updated_at = NOW() WHERE id = ?`;
                    connection.query(updateSql, [contactName, contact.id], (uErr) => {
                        if (uErr) console.error("Error updating contact name:", uErr);
                        resolve({ id: contact.id, wa_id: contact.wa_id, name: contactName || contact.name, lead_source: contact.lead_source || 'whatsapp', is_new: false, assigned_to: contact.assigned_to });
                    });
                } else {
                    const touchSql = `UPDATE whatsapp_contacts SET updated_at = NOW() WHERE id = ?`;
                    connection.query(touchSql, [contact.id], () => {});
                    resolve({ id: contact.id, wa_id: contact.wa_id, name: contact.name, lead_source: contact.lead_source || 'whatsapp', is_new: false, assigned_to: contact.assigned_to });
                }
            } else {
                const insertSql = `INSERT INTO whatsapp_contacts (wa_id, name, lead_source, created_at, updated_at) VALUES (?, ?, 'whatsapp', NOW(), NOW())`;
                connection.query(insertSql, [cleanWaId, contactName], async (iErr, result) => {
                    if (iErr) return reject(iErr);
                    const newContactId = result.insertId;
                    const assignedUserId = await autoAssignLeadToAdmin(newContactId);
                    resolve({ id: newContactId, wa_id: cleanWaId, name: contactName, lead_source: 'whatsapp', is_new: true, assigned_to: assignedUserId });
                });
            }
        });
    });
}

/**
 * Save incoming customer message
 */
function saveWhatsAppIncomingMessage({ contactId, messageId, messageText, mediaUrl, mediaType, timestamp }) {
    return new Promise((resolve, reject) => {
        if (!contactId) return reject(new Error("contactId is required"));

        if (messageId) {
            const checkSql = `SELECT id FROM whatsapp_messages WHERE message_id = ? LIMIT 1`;
            connection.query(checkSql, [messageId], (cErr, rows) => {
                if (!cErr && rows && rows.length > 0) {
                    return resolve({ id: rows[0].id, duplicate: true });
                }
                insertMessage();
            });
        } else {
            insertMessage();
        }

        function insertMessage() {
            const insertSql = `
                INSERT INTO whatsapp_messages 
                (contact_id, message_id, sender_type, message_text, media_url, media_type, timestamp, status, created_at)
                VALUES (?, ?, 'customer', ?, ?, ?, ?, 'delivered', NOW())
            `;
            connection.query(insertSql, [contactId, messageId || null, messageText || '', mediaUrl || null, mediaType || 'text', timestamp || null], (err, result) => {
                if (err) return reject(err);

                connection.query(`UPDATE whatsapp_contacts SET updated_at = NOW() WHERE id = ?`, [contactId], () => {});

                resolve({ id: result.insertId, contact_id: contactId, message_text: messageText, sender_type: 'customer' });
            });
        }
    });
}

/**
 * Save outgoing business message
 */
function saveWhatsAppOutgoingMessage({ contactId, messageId, messageText }) {
    return new Promise((resolve, reject) => {
        if (!contactId) return reject(new Error("contactId is required"));

        const insertSql = `
            INSERT INTO whatsapp_messages 
            (contact_id, message_id, sender_type, message_text, media_url, media_type, timestamp, status, created_at)
            VALUES (?, ?, 'business', ?, NULL, 'text', ?, 'sent', NOW())
        `;
        const nowTs = String(Math.floor(Date.now() / 1000));
        connection.query(insertSql, [contactId, messageId || null, messageText, nowTs], (err, result) => {
            if (err) return reject(err);

            connection.query(`UPDATE whatsapp_contacts SET updated_at = NOW() WHERE id = ?`, [contactId], () => {});

            resolve({
                id: result.insertId,
                contact_id: contactId,
                message_id: messageId,
                sender_type: 'business',
                message_text: messageText,
                created_at: new Date()
            });
        });
    });
}

/**
 * Get contacts list for CRM with last message, message counts, and role-based assignment filtering
 */
function getWhatsAppContactsList({ search = '', limit = 50, offset = 0, requestingUser = null, assignedToFilter = '', leadSourceFilter = '' } = {}) {
    return new Promise((resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let conditions = [];
        let params = [];

        // 1. Role-based lead isolation: Regular admin user (admin = 2) can ONLY see leads assigned to them
        if (!isSuperAdmin) {
            conditions.push(`c.assigned_to = ?`);
            params.push(currentUserId);
        } else if (assignedToFilter) {
            // Super Admin filtering
            if (assignedToFilter === 'unassigned') {
                conditions.push(`c.assigned_to IS NULL`);
            } else if (!isNaN(Number(assignedToFilter))) {
                conditions.push(`c.assigned_to = ?`);
                params.push(Number(assignedToFilter));
            }
        }

        // 2. Lead Source filter (custom vs whatsapp lead)
        if (leadSourceFilter) {
            if (leadSourceFilter === 'custom') {
                conditions.push(`c.lead_source = 'custom'`);
            } else if (leadSourceFilter === 'whatsapp') {
                conditions.push(`(c.lead_source = 'whatsapp' OR c.lead_source IS NULL)`);
            }
        }

        // 3. Search query filter
        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push(`(c.name LIKE ? OR c.wa_id LIKE ? OR m_last.message_text LIKE ?)`);
            params.push(term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                c.id,
                c.wa_id,
                c.name,
                COALESCE(c.lead_source, 'whatsapp') AS lead_source,
                c.assigned_to,
                c.assigned_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_user_name,
                u.email AS assigned_user_email,
                c.created_at,
                c.updated_at,
                (
                    SELECT m1.message_text 
                    FROM whatsapp_messages m1 
                    WHERE m1.contact_id = c.id 
                    ORDER BY m1.id DESC 
                    LIMIT 1
                ) AS last_message,
                (
                    SELECT m1.sender_type 
                    FROM whatsapp_messages m1 
                    WHERE m1.contact_id = c.id 
                    ORDER BY m1.id DESC 
                    LIMIT 1
                ) AS last_sender_type,
                (
                    SELECT m1.created_at 
                    FROM whatsapp_messages m1 
                    WHERE m1.contact_id = c.id 
                    ORDER BY m1.id DESC 
                    LIMIT 1
                ) AS last_message_time,
                (
                    SELECT COUNT(m2.id) 
                    FROM whatsapp_messages m2 
                    WHERE m2.contact_id = c.id
                ) AS total_messages
            FROM whatsapp_contacts c
            LEFT JOIN user_master u ON u.id = c.assigned_to
            LEFT JOIN whatsapp_messages m_last ON m_last.contact_id = c.id
            ${whereClause}
            GROUP BY c.id
            ORDER BY COALESCE(last_message_time, c.updated_at, c.created_at) DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, Number(limit), Number(offset)];

        connection.query(sql, queryParams, (err, rows) => {
            if (err) return reject(err);

            // Count query
            const countSql = `
                SELECT COUNT(DISTINCT c.id) as total 
                FROM whatsapp_contacts c 
                LEFT JOIN whatsapp_messages m_last ON m_last.contact_id = c.id
                ${whereClause}
            `;
            connection.query(countSql, params, (cErr, countRows) => {
                const totalCount = (!cErr && countRows && countRows[0]) ? countRows[0].total : (rows ? rows.length : 0);

                resolve({
                    contacts: rows ? JSON.parse(JSON.stringify(rows)) : [],
                    total: totalCount
                });
            });
        });
    });
}

/**
 * Get messages conversation thread for a contact with strict role-based access check
 */
function getWhatsAppMessagesHistory(contactId, requestingUser = null) {
    return new Promise((resolve, reject) => {
        if (!contactId) return reject(new Error("contactId is required"));

        const contactSql = `
            SELECT 
                c.id, 
                c.wa_id, 
                c.name, 
                COALESCE(c.lead_source, 'whatsapp') AS lead_source,
                c.assigned_to,
                c.assigned_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_user_name,
                u.email AS assigned_user_email,
                c.created_at, 
                c.updated_at 
            FROM whatsapp_contacts c
            LEFT JOIN user_master u ON u.id = c.assigned_to
            WHERE c.id = ? 
            LIMIT 1
        `;
        connection.query(contactSql, [contactId], (cErr, cRows) => {
            if (cErr) return reject(cErr);
            if (!cRows || cRows.length === 0) return resolve(null);

            const contact = cRows[0];
            const isSuperAdmin = requestingUser?.admin === 1;

            // Strict Lead Security: Regular admin users cannot access leads not assigned to them
            if (!isSuperAdmin && contact.assigned_to !== requestingUser?.id) {
                return resolve({ unauthorized: true });
            }

            const messagesSql = `
                SELECT 
                    id,
                    contact_id,
                    message_id,
                    sender_type,
                    message_text,
                    media_url,
                    media_type,
                    timestamp,
                    status,
                    created_at
                FROM whatsapp_messages
                WHERE contact_id = ?
                ORDER BY id ASC
            `;

            connection.query(messagesSql, [contactId], (mErr, mRows) => {
                if (mErr) return reject(mErr);

                resolve({
                    contact: JSON.parse(JSON.stringify(contact)),
                    messages: mRows ? JSON.parse(JSON.stringify(mRows)) : []
                });
            });
        });
    });
}

/**
 * Get CRM Statistics
 */
function getWhatsAppCRMStats(requestingUser = null) {
    return new Promise((resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let contactCondition = isSuperAdmin ? '' : `WHERE assigned_to = ${currentUserId}`;
        let messageCondition = isSuperAdmin ? '' : `JOIN whatsapp_contacts c ON c.id = whatsapp_messages.contact_id WHERE c.assigned_to = ${currentUserId}`;

        const statsSql = `
            SELECT 
                (SELECT COUNT(*) FROM whatsapp_contacts ${contactCondition}) AS total_contacts,
                (SELECT COUNT(*) FROM whatsapp_contacts ${contactCondition ? `${contactCondition} AND (lead_source = 'whatsapp' OR lead_source IS NULL)` : "WHERE (lead_source = 'whatsapp' OR lead_source IS NULL)"}) AS total_whatsapp_leads,
                (SELECT COUNT(*) FROM whatsapp_contacts ${contactCondition ? `${contactCondition} AND lead_source = 'custom'` : "WHERE lead_source = 'custom'"}) AS total_custom_leads,
                (SELECT COUNT(*) FROM whatsapp_messages ${messageCondition}) AS total_messages,
                (SELECT COUNT(*) FROM whatsapp_messages ${isSuperAdmin ? "WHERE sender_type = 'customer'" : `${messageCondition} AND whatsapp_messages.sender_type = 'customer'`}) AS total_inbound,
                (SELECT COUNT(*) FROM whatsapp_messages ${isSuperAdmin ? "WHERE sender_type = 'business'" : `${messageCondition} AND whatsapp_messages.sender_type = 'business'`}) AS total_outbound,
                (SELECT COUNT(*) FROM whatsapp_messages ${isSuperAdmin ? "WHERE DATE(created_at) = CURDATE()" : `${messageCondition} AND DATE(whatsapp_messages.created_at) = CURDATE()`}) AS today_messages
        `;
        connection.query(statsSql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows[0] ? rows[0] : { total_contacts: 0, total_whatsapp_leads: 0, total_custom_leads: 0, total_messages: 0, total_inbound: 0, total_outbound: 0, today_messages: 0 });
        });
    });
}

/**
 * Get all Admin Users for Lead Management / Distribution
 */
function getLeadManagersListModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                u.id AS user_id,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS name,
                u.email,
                u.phone,
                u.bio,
                u.status AS user_status,
                COALESCE(s.is_active, 1) AS is_active,
                (SELECT COUNT(*) FROM whatsapp_contacts wc WHERE wc.assigned_to = u.id) AS active_leads_count,
                s.leads_count AS total_assigned_count,
                s.last_assigned_at,
                s.updated_at
            FROM user_master u
            LEFT JOIN crm_lead_distribution_settings s ON s.user_id = u.id
            WHERE u.admin = 2
            ORDER BY u.id ASC
        `;
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows ? JSON.parse(JSON.stringify(rows)) : []);
        });
    });
}

/**
 * Toggle Admin User in Lead Distribution Pool
 */
function toggleLeadManagerStatusModel({ userId, isActive }) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO crm_lead_distribution_settings (user_id, is_active, updated_at) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE is_active = VALUES(is_active), updated_at = NOW()
        `;
        connection.query(sql, [Number(userId), Number(isActive) ? 1 : 0], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

/**
 * Manually assign or reassign a lead to an admin user
 */
function manuallyAssignLeadModel({ contactId, userId }) {
    return new Promise((resolve, reject) => {
        const targetUserId = userId ? Number(userId) : null;
        const sql = `UPDATE whatsapp_contacts SET assigned_to = ?, assigned_at = NOW() WHERE id = ?`;
        connection.query(sql, [targetUserId, Number(contactId)], (err, result) => {
            if (err) return reject(err);

            if (targetUserId) {
                const statSql = `
                    INSERT INTO crm_lead_distribution_settings (user_id, leads_count, last_assigned_at, is_active)
                    VALUES (?, 1, NOW(), 1)
                    ON DUPLICATE KEY UPDATE leads_count = leads_count + 1, last_assigned_at = NOW()
                `;
                connection.query(statSql, [targetUserId], () => {});
            }

            resolve(result);
        });
    });
}

/**
 * Get Lead Distribution Overview Statistics for Super Admin
 */
function getLeadDistributionStatsModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM whatsapp_contacts) AS total_leads,
                (SELECT COUNT(*) FROM whatsapp_contacts WHERE assigned_to IS NOT NULL) AS assigned_leads,
                (SELECT COUNT(*) FROM whatsapp_contacts WHERE assigned_to IS NULL) AS unassigned_leads,
                (SELECT COUNT(*) FROM user_master WHERE admin = 2 AND status = 1) AS total_admin_users,
                (
                    SELECT COUNT(*) 
                    FROM crm_lead_distribution_settings s 
                    JOIN user_master u ON u.id = s.user_id 
                    WHERE s.is_active = 1 AND u.status = 1 AND u.admin = 2
                ) AS active_lead_managers
        `;
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows[0] ? rows[0] : { total_leads: 0, assigned_leads: 0, unassigned_leads: 0, total_admin_users: 0, active_lead_managers: 0 });
        });
    });
}

/**
 * Create a Manual Lead (Contact + Optional Followup + Optional Initial Message)
 */
function createManualLeadModel({
    name = '',
    phone = '',
    email = '',
    assigned_to = null,
    lead_type = 'warm',
    travel_date = null,
    booking_days = 1,
    travel_destination = 'Sundarban',
    adults = null,
    children = null,
    infants = null,
    number_of_persons = 2,
    total_rooms = 1,
    rooms = null,
    room_details = null,
    package_name = '',
    package_rate = '',
    next_followup_date = null,
    extra_note = '',
    initial_message = '',
    send_message_now = false,
    requestingUser = null
} = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!phone || !String(phone).trim()) {
                return reject(new Error("WhatsApp phone number is required."));
            }

            let cleanPhone = String(phone).replace(/[^0-9]/g, '').trim();
            if (!cleanPhone) {
                return reject(new Error("A valid numeric phone number is required."));
            }

            // Auto-prefix Indian numbers if 10 digits
            if (cleanPhone.length === 10) {
                cleanPhone = '91' + cleanPhone;
            }

            const isSuperAdmin = requestingUser?.admin === 1;
            const currentUserId = requestingUser?.id;

            // Determine target assignment
            let targetAssignedTo = null;
            if (!isSuperAdmin) {
                targetAssignedTo = currentUserId;
            } else if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
                if (assigned_to === 'unassigned') {
                    targetAssignedTo = null;
                } else if (assigned_to === 'auto') {
                    targetAssignedTo = 'auto';
                } else if (!isNaN(Number(assigned_to))) {
                    targetAssignedTo = Number(assigned_to);
                }
            }

            const leadName = (name && String(name).trim()) ? String(name).trim() : `Lead ${cleanPhone}`;

            // Check if contact already exists
            const existingContact = await new Promise((res, rej) => {
                connection.query(`SELECT id, wa_id, name, assigned_to, lead_source FROM whatsapp_contacts WHERE wa_id = ? LIMIT 1`, [cleanPhone], (err, rows) => {
                    if (err) return rej(err);
                    res(rows && rows.length > 0 ? rows[0] : null);
                });
            });

            let contactId = null;
            let isNewContact = false;

            if (existingContact) {
                contactId = existingContact.id;
                let updateFields = [`updated_at = NOW()`];
                let updateParams = [];

                if (!existingContact.lead_source) {
                    updateFields.push(`lead_source = 'custom'`);
                }

                if (leadName && leadName !== existingContact.name && leadName !== `Lead ${cleanPhone}`) {
                    updateFields.push(`name = ?`);
                    updateParams.push(leadName);
                }

                if (targetAssignedTo !== 'auto' && targetAssignedTo !== undefined) {
                    if (isSuperAdmin || !existingContact.assigned_to) {
                        updateFields.push(`assigned_to = ?`, `assigned_at = NOW()`);
                        updateParams.push(targetAssignedTo);
                    }
                }

                updateParams.push(contactId);
                await new Promise((res, rej) => {
                    connection.query(`UPDATE whatsapp_contacts SET ${updateFields.join(', ')} WHERE id = ?`, updateParams, (err) => {
                        if (err) return rej(err);
                        res();
                    });
                });
            } else {
                isNewContact = true;
                const assignedUserId = (targetAssignedTo === 'auto' || targetAssignedTo === null) ? null : targetAssignedTo;
                const insertResult = await new Promise((res, rej) => {
                    connection.query(
                        `INSERT INTO whatsapp_contacts (wa_id, name, lead_source, assigned_to, assigned_at, created_at, updated_at) VALUES (?, ?, 'custom', ?, ${assignedUserId ? 'NOW()' : 'NULL'}, NOW(), NOW())`,
                        [cleanPhone, leadName, assignedUserId],
                        (err, result) => {
                            if (err) return rej(err);
                            res(result);
                        }
                    );
                });
                contactId = insertResult.insertId;

                // If auto-assign was specified or default for super admin when assigned_to is 'auto'
                if (targetAssignedTo === 'auto') {
                    const autoAssignedId = await autoAssignLeadToAdmin(contactId);
                    targetAssignedTo = autoAssignedId;
                }
            }

            // Handle Initial Message / WhatsApp Outgoing Send
            const messageText = (initial_message && String(initial_message).trim()) || '';
            if (messageText) {
                if (send_message_now) {
                    try {
                        const { sendWhatsAppCloudMessage } = require('../../helper/whatsappHelper');
                        const sendRes = await sendWhatsAppCloudMessage(cleanPhone, messageText);
                        await saveWhatsAppOutgoingMessage({
                            contactId,
                            messageId: sendRes.messageId || null,
                            messageText
                        });
                    } catch (mErr) {
                        console.error("[WhatsApp Send Manual Lead Message Error]:", mErr);
                        await saveWhatsAppOutgoingMessage({
                            contactId,
                            messageId: null,
                            messageText
                        });
                    }
                } else {
                    await saveWhatsAppOutgoingMessage({
                        contactId,
                        messageId: null,
                        messageText
                    });
                }
            }

            // Save Follow-up details if provided
            let followupData = null;
            try {
                const { saveLeadFollowupModel } = require('./crmFollowupModel');
                followupData = await saveLeadFollowupModel({
                    contact_id: contactId,
                    lead_name: leadName,
                    phone: cleanPhone,
                    email: email || '',
                    lead_type: lead_type || 'warm',
                    travel_date: travel_date || null,
                    booking_days: booking_days || 1,
                    travel_destination: travel_destination || 'Sundarban',
                    adults: adults,
                    children: children,
                    infants: infants,
                    number_of_persons: number_of_persons || 2,
                    total_rooms: total_rooms || 1,
                    rooms: rooms || room_details,
                    room_details: rooms || room_details,
                    package_name: package_name || '',
                    package_rate: package_rate || '',
                    extra_note: extra_note || (messageText ? `Initial message: ${messageText}` : 'Manual lead created'),
                    next_followup_date: next_followup_date || null,
                    admin_user_id: currentUserId || 1
                });
            } catch (fErr) {
                console.error("[CRM Save Follow-up during manual lead creation error]:", fErr);
            }

            resolve({
                success: true,
                contact_id: contactId,
                wa_id: cleanPhone,
                name: leadName,
                is_new: isNewContact,
                assigned_to: targetAssignedTo,
                followup: followupData
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Delete WhatsApp Contact / Lead and all associated CRM records
 * @param {number|string} contactId
 * @returns {Promise<{success: boolean, notFound?: boolean, contact?: object}>}
 */
function deleteWhatsAppContactModel(contactId) {
    return new Promise((resolve, reject) => {
        if (!contactId) return reject(new Error("Contact ID is required."));

        const cleanId = parseInt(contactId, 10);
        if (isNaN(cleanId) || cleanId <= 0) {
            return reject(new Error("Invalid Contact ID."));
        }

        // 1. Check if contact exists
        connection.query(`SELECT id, wa_id, name, assigned_to FROM whatsapp_contacts WHERE id = ? LIMIT 1`, [cleanId], async (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) {
                return resolve({ success: false, notFound: true });
            }

            const contact = rows[0];

            // Helper to execute query safely ignoring errors if table/column does not exist
            const safeQuery = (sql, params = []) => {
                return new Promise((res) => {
                    connection.query(sql, params, (qErr) => {
                        if (qErr) {
                            console.warn(`[Safe Delete Notice] ${sql.substring(0, 40)}...:`, qErr.message);
                        }
                        res();
                    });
                });
            };

            try {
                // Delete messages
                await safeQuery(`DELETE FROM whatsapp_messages WHERE contact_id = ?`, [cleanId]);

                // Delete followup logs
                await safeQuery(`DELETE FROM crm_lead_followup_logs WHERE contact_id = ?`, [cleanId]);

                // Delete followups
                await safeQuery(`DELETE FROM crm_lead_followups WHERE contact_id = ?`, [cleanId]);

                // Delete lead notes
                await safeQuery(`DELETE FROM crm_lead_notes WHERE contact_id = ?`, [cleanId]);

                // Delete tasks associated with this lead
                await safeQuery(`DELETE FROM crm_tasks WHERE lead_contact_id = ?`, [cleanId]);

                // Nullify contact_id in invoices so billing records remain intact
                await safeQuery(`UPDATE crm_invoices SET contact_id = NULL WHERE contact_id = ?`, [cleanId]);

                // Delete campaign recipients
                await safeQuery(`DELETE FROM whatsapp_campaign_recipients WHERE contact_id = ?`, [cleanId]);

                // Finally delete contact itself
                connection.query(`DELETE FROM whatsapp_contacts WHERE id = ?`, [cleanId], async (delErr) => {
                    if (delErr) return reject(delErr);

                    // Decrement staff lead distribution counter if assigned
                    if (contact.assigned_to) {
                        await safeQuery(`UPDATE crm_lead_distribution_settings SET leads_count = GREATEST(0, leads_count - 1) WHERE user_id = ?`, [contact.assigned_to]);
                    }

                    resolve({ success: true, contact });
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

module.exports = {
    upsertWhatsAppContact,
    saveWhatsAppIncomingMessage,
    saveWhatsAppOutgoingMessage,
    getWhatsAppContactsList,
    getWhatsAppMessagesHistory,
    getWhatsAppCRMStats,
    getLeadManagersListModel,
    toggleLeadManagerStatusModel,
    manuallyAssignLeadModel,
    getLeadDistributionStatsModel,
    autoAssignLeadToAdmin,
    maskPhoneNumber,
    createManualLeadModel,
    deleteWhatsAppContactModel
};
