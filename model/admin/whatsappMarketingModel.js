const connection = require('../../Connection');
const { sendWhatsAppCloudMessage, normalizePhoneNumber } = require('../../helper/whatsappHelper');

/**
 * Auto-initialize WhatsApp Marketing Campaign Tables
 */
function initWhatsAppCampaignTables() {
    const createCampaignsTable = `
        CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_name VARCHAR(255) NOT NULL,
            message_text TEXT NOT NULL,
            media_url TEXT NULL,
            media_type VARCHAR(50) NULL,
            cta_url VARCHAR(255) NULL,
            cta_text VARCHAR(100) NULL,
            target_audience_type VARCHAR(50) DEFAULT 'selected',
            target_filter_json JSON NULL,
            total_recipients INT DEFAULT 0,
            total_sent INT DEFAULT 0,
            total_delivered INT DEFAULT 0,
            total_failed INT DEFAULT 0,
            status ENUM('draft', 'scheduled', 'processing', 'completed', 'cancelled') DEFAULT 'completed',
            scheduled_at DATETIME NULL,
            sent_at DATETIME NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_scheduled_at (scheduled_at),
            INDEX idx_created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createRecipientsTable = `
        CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_id INT NOT NULL,
            contact_id INT NOT NULL,
            phone VARCHAR(50) NOT NULL,
            recipient_name VARCHAR(255) NULL,
            status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
            message_id VARCHAR(255) NULL,
            error_message TEXT NULL,
            sent_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_campaign (campaign_id),
            INDEX idx_contact (contact_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createCampaignsTable, (err) => {
        if (err) console.error("[WhatsApp Marketing] Error creating whatsapp_campaigns table:", err.message);
    });

    connection.query(createRecipientsTable, (err) => {
        if (err) console.error("[WhatsApp Marketing] Error creating whatsapp_campaign_recipients table:", err.message);
    });
}

initWhatsAppCampaignTables();

function formatDateForDb(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

/**
 * Get Audience Leads for Marketing with advanced filters (including converted and non-converted leads)
 */
function getMarketingAudienceLeadsModel({
    page = 1,
    limit = 25,
    search = '',
    conversion_status = 'all', // 'all', 'converted', 'non_converted'
    lead_type = '', // 'hot', 'warm', 'cold', ''
    destination = '',
    date_filter_type = 'created_at', // 'created_at', 'travel_date', 'next_followup', 'converted_at', 'last_followup'
    from_date = '',
    to_date = '',
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

        // 2. Conversion Status filter
        if (conversion_status === 'converted') {
            conditions.push(`f.is_converted = 1`);
        } else if (conversion_status === 'non_converted') {
            conditions.push(`(f.is_converted = 0 OR f.is_converted IS NULL)`);
        }
        // If 'all', do not filter by is_converted

        // 3. Lead Temperature filter (hot, warm, cold)
        if (lead_type && ['hot', 'warm', 'cold'].includes(String(lead_type).toLowerCase())) {
            conditions.push(`f.lead_type = ?`);
            params.push(String(lead_type).toLowerCase());
        }

        // 4. Destination filter
        if (destination && destination.trim() !== '') {
            conditions.push(`f.travel_destination LIKE ?`);
            params.push(`%${destination.trim()}%`);
        }

        // 5. Date range filter
        let targetDateField = 'c.created_at';
        if (date_filter_type === 'travel_date') {
            targetDateField = 'f.travel_date';
        } else if (date_filter_type === 'next_followup') {
            targetDateField = 'f.next_followup_date';
        } else if (date_filter_type === 'converted_at') {
            targetDateField = 'DATE(f.converted_at)';
        } else if (date_filter_type === 'last_followup') {
            targetDateField = 'DATE(f.last_followup_at)';
        }

        if (from_date && to_date) {
            const fDate = formatDateForDb(from_date);
            const tDate = formatDateForDb(to_date);
            if (fDate && tDate) {
                conditions.push(`${targetDateField} BETWEEN ? AND ?`);
                params.push(fDate, tDate);
            }
        } else if (from_date) {
            const fDate = formatDateForDb(from_date);
            if (fDate) {
                conditions.push(`${targetDateField} >= ?`);
                params.push(fDate);
            }
        } else if (to_date) {
            const tDate = formatDateForDb(to_date);
            if (tDate) {
                conditions.push(`${targetDateField} <= ?`);
                params.push(tDate);
            }
        }

        // 6. Search filter (Name, Phone, Destination, Package, Notes)
        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push(`(
                c.name LIKE ? 
                OR c.wa_id LIKE ? 
                OR f.lead_name LIKE ? 
                OR f.phone LIKE ? 
                OR f.travel_destination LIKE ? 
                OR f.package_name LIKE ? 
                OR f.conversion_note LIKE ? 
                OR f.extra_note LIKE ?
            )`);
            params.push(term, term, term, term, term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                c.id AS contact_id,
                c.wa_id,
                COALESCE(NULLIF(f.lead_name, ''), c.name, 'WhatsApp Customer') AS name,
                COALESCE(NULLIF(f.phone, ''), c.wa_id) AS phone,
                f.email,
                COALESCE(f.is_converted, 0) AS is_converted,
                f.converted_at,
                f.converted_by,
                f.converted_amount,
                f.conversion_note,
                COALESCE(f.lead_type, 'warm') AS lead_type,
                f.travel_destination,
                f.travel_date,
                f.number_of_persons,
                f.total_rooms,
                f.package_name,
                f.package_rate,
                f.extra_note,
                f.next_followup_date,
                f.last_followup_at,
                c.assigned_to,
                c.created_at AS contact_created_at,
                c.updated_at AS contact_updated_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_user_name,
                u.email AS assigned_user_email,
                CONCAT(uc.first_name, ' ', COALESCE(uc.last_name, '')) AS converted_by_name,
                (
                    SELECT m.message_text 
                    FROM whatsapp_messages m 
                    WHERE m.contact_id = c.id 
                    ORDER BY m.id DESC 
                    LIMIT 1
                ) AS last_message,
                (
                    SELECT m.created_at 
                    FROM whatsapp_messages m 
                    WHERE m.contact_id = c.id 
                    ORDER BY m.id DESC 
                    LIMIT 1
                ) AS last_message_time,
                (
                    SELECT COUNT(m.id) 
                    FROM whatsapp_messages m 
                    WHERE m.contact_id = c.id
                ) AS total_messages
            FROM whatsapp_contacts c
            LEFT JOIN crm_lead_followups f ON f.contact_id = c.id
            LEFT JOIN user_master u ON u.id = c.assigned_to
            LEFT JOIN user_master uc ON uc.id = f.converted_by
            ${whereClause}
            ORDER BY 
                f.is_converted DESC,
                c.updated_at DESC,
                c.id DESC
            LIMIT ? OFFSET ?
        `;

        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.max(1, parseInt(limit) || 25);
        const offset = (parsedPage - 1) * parsedLimit;

        const queryParams = [...params, parsedLimit, offset];

        connection.query(sql, queryParams, (err, rows) => {
            if (err) return reject(err);

            const countSql = `
                SELECT COUNT(DISTINCT c.id) AS total
                FROM whatsapp_contacts c
                LEFT JOIN crm_lead_followups f ON f.contact_id = c.id
                ${whereClause}
            `;

            connection.query(countSql, params, (cErr, cRows) => {
                const total = (!cErr && cRows && cRows[0]) ? cRows[0].total : (rows ? rows.length : 0);

                // Global Stats for Marketing Audience
                let baseStatsWhere = isSuperAdmin ? '' : `WHERE c.assigned_to = ${Number(currentUserId)}`;
                const statsSql = `
                    SELECT 
                        COUNT(DISTINCT c.id) AS total_leads,
                        SUM(CASE WHEN f.is_converted = 1 THEN 1 ELSE 0 END) AS converted_leads,
                        SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) THEN 1 ELSE 0 END) AS non_converted_leads,
                        SUM(CASE WHEN f.lead_type = 'hot' AND (f.is_converted = 0 OR f.is_converted IS NULL) THEN 1 ELSE 0 END) AS hot_leads,
                        SUM(CASE WHEN f.lead_type = 'warm' AND (f.is_converted = 0 OR f.is_converted IS NULL) THEN 1 ELSE 0 END) AS warm_leads,
                        SUM(CASE WHEN f.lead_type = 'cold' AND (f.is_converted = 0 OR f.is_converted IS NULL) THEN 1 ELSE 0 END) AS cold_leads
                    FROM whatsapp_contacts c
                    LEFT JOIN crm_lead_followups f ON f.contact_id = c.id
                    ${baseStatsWhere}
                `;

                connection.query(statsSql, (sErr, sRows) => {
                    const stats = (sRows && sRows[0]) ? sRows[0] : {};

                    resolve({
                        leads: rows ? JSON.parse(JSON.stringify(rows)) : [],
                        total,
                        page: parsedPage,
                        limit: parsedLimit,
                        totalPages: Math.ceil(total / parsedLimit),
                        stats: {
                            total_leads: Number(stats.total_leads || 0),
                            converted_leads: Number(stats.converted_leads || 0),
                            non_converted_leads: Number(stats.non_converted_leads || 0),
                            hot_leads: Number(stats.hot_leads || 0),
                            warm_leads: Number(stats.warm_leads || 0),
                            cold_leads: Number(stats.cold_leads || 0)
                        }
                    });
                });
            });
        });
    });
}

/**
 * Create and Launch or Schedule a WhatsApp Marketing Campaign
 */
function createAndLaunchWhatsAppCampaignModel({
    campaign_name,
    message_text,
    media_url = '',
    media_type = 'image',
    cta_url = '',
    cta_text = '',
    schedule_type = 'instant', // 'instant' or 'scheduled'
    scheduled_at = null,
    recipient_ids = [],
    target_all_filtered = false,
    filter_params = {},
    requestingUser = null
}) {
    return new Promise(async (resolve, reject) => {
        if (!campaign_name || !campaign_name.trim()) {
            return reject(new Error("Campaign Name is required."));
        }
        if (!message_text || !message_text.trim()) {
            return reject(new Error("Message Text is required."));
        }

        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        try {
            // 1. Resolve Target Recipients
            let targetRecipients = [];

            if (target_all_filtered && filter_params) {
                // Fetch all matching leads using filters (capped at 5000 for safe bulk send)
                const filterRes = await getMarketingAudienceLeadsModel({
                    ...filter_params,
                    page: 1,
                    limit: 5000,
                    requestingUser
                });
                targetRecipients = filterRes.leads || [];
            } else if (Array.isArray(recipient_ids) && recipient_ids.length > 0) {
                // Query specific recipient contacts
                const placeholders = recipient_ids.map(() => '?').join(',');
                const querySql = `
                    SELECT 
                        c.id AS contact_id,
                        c.wa_id,
                        COALESCE(NULLIF(f.lead_name, ''), c.name, 'Customer') AS name,
                        f.travel_destination,
                        f.package_name,
                        f.is_converted
                    FROM whatsapp_contacts c
                    LEFT JOIN crm_lead_followups f ON f.contact_id = c.id
                    WHERE c.id IN (${placeholders})
                    ${!isSuperAdmin ? 'AND c.assigned_to = ?' : ''}
                `;
                const queryParams = !isSuperAdmin ? [...recipient_ids, currentUserId] : recipient_ids;

                targetRecipients = await new Promise((res, rej) => {
                    connection.query(querySql, queryParams, (err, rows) => {
                        if (err) return rej(err);
                        res(rows || []);
                    });
                });
            }

            if (targetRecipients.length === 0) {
                return reject(new Error("No valid recipients found for this campaign."));
            }

            const totalRecipientsCount = targetRecipients.length;
            const isScheduled = schedule_type === 'scheduled' && scheduled_at;
            const initialStatus = isScheduled ? 'scheduled' : 'processing';

            // 2. Insert Campaign Header Record
            const insertCampaignSql = `
                INSERT INTO whatsapp_campaigns (
                    campaign_name,
                    message_text,
                    media_url,
                    media_type,
                    cta_url,
                    cta_text,
                    target_audience_type,
                    target_filter_json,
                    total_recipients,
                    status,
                    scheduled_at,
                    created_by,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const campaignResult = await new Promise((res, rej) => {
                connection.query(insertCampaignSql, [
                    campaign_name.trim(),
                    message_text.trim(),
                    media_url ? media_url.trim() : null,
                    media_type || 'image',
                    cta_url ? cta_url.trim() : null,
                    cta_text ? cta_text.trim() : null,
                    target_all_filtered ? 'filtered' : 'selected',
                    filter_params ? JSON.stringify(filter_params) : null,
                    totalRecipientsCount,
                    initialStatus,
                    isScheduled ? new Date(scheduled_at) : null,
                    currentUserId
                ], (err, result) => {
                    if (err) return rej(err);
                    res(result);
                });
            });

            const campaignId = campaignResult.insertId;

            // 3. If Scheduled: Insert pending recipients and return
            if (isScheduled) {
                for (const recipient of targetRecipients) {
                    const insertRecSql = `
                        INSERT INTO whatsapp_campaign_recipients (
                            campaign_id,
                            contact_id,
                            phone,
                            recipient_name,
                            status,
                            created_at
                        ) VALUES (?, ?, ?, ?, 'pending', NOW())
                    `;
                    connection.query(insertRecSql, [
                        campaignId,
                        recipient.contact_id,
                        recipient.wa_id,
                        recipient.name
                    ], () => {});
                }

                return resolve({
                    success: true,
                    campaign_id: campaignId,
                    campaign_name: campaign_name.trim(),
                    status: 'scheduled',
                    scheduled_at,
                    total_recipients: totalRecipientsCount,
                    msg: `Campaign "${campaign_name}" scheduled successfully for ${new Date(scheduled_at).toLocaleString('en-IN')}.`
                });
            }

            // 4. Instant Launch: Personalize & Send Outbound Messages
            let sentCount = 0;
            let failedCount = 0;

            for (const recipient of targetRecipients) {
                // Personalize variables: {{name}}, {{phone}}, {{destination}}, {{package}}
                let personalizedText = message_text
                    .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'Valued Guest')
                    .replace(/\{\{\s*phone\s*\}\}/gi, recipient.wa_id || '')
                    .replace(/\{\{\s*destination\s*\}\}/gi, recipient.travel_destination || 'Sundarban')
                    .replace(/\{\{\s*package\s*\}\}/gi, recipient.package_name || 'Safari');

                // Append CTA button text / link if specified
                if (cta_url && cta_text) {
                    personalizedText += `\n\n👉 *${cta_text}*: ${cta_url}`;
                } else if (cta_url) {
                    personalizedText += `\n\n🌐 *Link*: ${cta_url}`;
                }

                try {
                    const sendRes = await sendWhatsAppCloudMessage(recipient.wa_id, personalizedText);

                    if (sendRes?.success) {
                        sentCount++;
                        const msgId = sendRes.messageId || `msg_${Date.now()}`;

                        // Store outgoing message in CRM conversation thread
                        const insertMsgSql = `
                            INSERT INTO whatsapp_messages (
                                contact_id,
                                message_id,
                                sender_type,
                                message_text,
                                media_url,
                                media_type,
                                status,
                                created_at
                            ) VALUES (?, ?, 'business', ?, ?, ?, 'delivered', NOW())
                        `;
                        connection.query(insertMsgSql, [
                            recipient.contact_id,
                            msgId,
                            personalizedText,
                            media_url || null,
                            media_type || null
                        ], () => {});

                        // Record recipient status
                        const insertRecSql = `
                            INSERT INTO whatsapp_campaign_recipients (
                                campaign_id,
                                contact_id,
                                phone,
                                recipient_name,
                                status,
                                message_id,
                                sent_at,
                                created_at
                            ) VALUES (?, ?, ?, ?, 'sent', ?, NOW(), NOW())
                        `;
                        connection.query(insertRecSql, [
                            campaignId,
                            recipient.contact_id,
                            recipient.wa_id,
                            recipient.name,
                            msgId
                        ], () => {});
                    } else {
                        failedCount++;
                        const insertRecSql = `
                            INSERT INTO whatsapp_campaign_recipients (
                                campaign_id,
                                contact_id,
                                phone,
                                recipient_name,
                                status,
                                error_message,
                                created_at
                            ) VALUES (?, ?, ?, ?, 'failed', ?, NOW())
                        `;
                        connection.query(insertRecSql, [
                            campaignId,
                            recipient.contact_id,
                            recipient.wa_id,
                            recipient.name,
                            sendRes?.error || 'Failed to send'
                        ], () => {});
                    }
                } catch (sendErr) {
                    failedCount++;
                    console.error("[Campaign Send Error]:", sendErr);
                }
            }

            // 5. Update Campaign Summary Status
            const updateCampaignSql = `
                UPDATE whatsapp_campaigns
                SET 
                    status = 'completed',
                    total_sent = ?,
                    total_failed = ?,
                    sent_at = NOW()
                WHERE id = ?
            `;
            connection.query(updateCampaignSql, [sentCount, failedCount, campaignId], () => {});

            resolve({
                success: true,
                campaign_id: campaignId,
                campaign_name: campaign_name.trim(),
                status: 'completed',
                total_recipients: totalRecipientsCount,
                total_sent: sentCount,
                total_failed: failedCount,
                msg: `🎉 Campaign "${campaign_name}" launched! Successfully sent to ${sentCount} recipients.`
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get List of WhatsApp Campaigns
 */
function getWhatsAppCampaignsListModel({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    requestingUser = null
} = {}) {
    return new Promise((resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let conditions = [];
        let params = [];

        if (!isSuperAdmin) {
            conditions.push(`c.created_by = ?`);
            params.push(currentUserId);
        }

        if (status && status !== 'all') {
            conditions.push(`c.status = ?`);
            params.push(status);
        }

        if (search && search.trim() !== '') {
            conditions.push(`c.campaign_name LIKE ?`);
            params.push(`%${search.trim()}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                c.id,
                c.campaign_name,
                c.message_text,
                c.media_url,
                c.media_type,
                c.cta_url,
                c.cta_text,
                c.target_audience_type,
                c.total_recipients,
                c.total_sent,
                c.total_delivered,
                c.total_failed,
                c.status,
                c.scheduled_at,
                c.sent_at,
                c.created_by,
                c.created_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
                u.email AS created_by_email
            FROM whatsapp_campaigns c
            LEFT JOIN user_master u ON u.id = c.created_by
            ${whereClause}
            ORDER BY c.id DESC
            LIMIT ? OFFSET ?
        `;

        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.max(1, parseInt(limit) || 20);
        const offset = (parsedPage - 1) * parsedLimit;

        connection.query(sql, [...params, parsedLimit, offset], (err, rows) => {
            if (err) return reject(err);

            const countSql = `SELECT COUNT(*) AS total FROM whatsapp_campaigns c ${whereClause}`;
            connection.query(countSql, params, (cErr, cRows) => {
                const total = (!cErr && cRows && cRows[0]) ? cRows[0].total : (rows ? rows.length : 0);

                resolve({
                    campaigns: rows ? JSON.parse(JSON.stringify(rows)) : [],
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
 * Get Details of a Specific Campaign with Recipient Logs
 */
function getWhatsAppCampaignDetailsModel(campaignId, requestingUser = null) {
    return new Promise((resolve, reject) => {
        if (!campaignId) return reject(new Error("Campaign ID is required"));

        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        const campaignSql = `
            SELECT 
                c.*,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
                u.email AS created_by_email
            FROM whatsapp_campaigns c
            LEFT JOIN user_master u ON u.id = c.created_by
            WHERE c.id = ?
            LIMIT 1
        `;

        connection.query(campaignSql, [campaignId], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(null);

            const campaign = rows[0];
            if (!isSuperAdmin && campaign.created_by !== currentUserId) {
                return resolve({ unauthorized: true });
            }

            const recipientsSql = `
                SELECT 
                    r.id,
                    r.contact_id,
                    r.phone,
                    r.recipient_name,
                    r.status,
                    r.message_id,
                    r.error_message,
                    r.sent_at,
                    r.created_at
                FROM whatsapp_campaign_recipients r
                WHERE r.campaign_id = ?
                ORDER BY r.id ASC
                LIMIT 500
            `;

            connection.query(recipientsSql, [campaignId], (rErr, rRows) => {
                if (rErr) return reject(rErr);

                resolve({
                    campaign: JSON.parse(JSON.stringify(campaign)),
                    recipients: rRows ? JSON.parse(JSON.stringify(rRows)) : []
                });
            });
        });
    });
}

module.exports = {
    initWhatsAppCampaignTables,
    getMarketingAudienceLeadsModel,
    createAndLaunchWhatsAppCampaignModel,
    getWhatsAppCampaignsListModel,
    getWhatsAppCampaignDetailsModel
};
