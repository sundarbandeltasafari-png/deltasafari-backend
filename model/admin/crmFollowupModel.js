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
            adults INT DEFAULT 1,
            children INT DEFAULT 0,
            infants INT DEFAULT 0,
            number_of_persons INT DEFAULT 1,
            total_rooms INT DEFAULT 1,
            room_details LONGTEXT NULL,
            package_name VARCHAR(255) NULL,
            package_rate VARCHAR(100) NULL,
            is_converted TINYINT(1) DEFAULT 0,
            converted_at DATETIME NULL,
            converted_by INT NULL,
            converted_amount VARCHAR(100) NULL,
            conversion_note TEXT NULL,
            extra_note TEXT NULL,
            next_followup_date DATE NULL,
            last_followup_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_followup_by INT NULL,
            created_by INT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_contact_id (contact_id),
            INDEX idx_lead_type (lead_type),
            INDEX idx_is_converted (is_converted),
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
            adults INT DEFAULT 1,
            children INT DEFAULT 0,
            infants INT DEFAULT 0,
            number_of_persons INT DEFAULT 1,
            total_rooms INT DEFAULT 1,
            room_details LONGTEXT NULL,
            package_name VARCHAR(255) NULL,
            package_rate VARCHAR(100) NULL,
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

    // Run safe migrations for existing tables
    const migrations = [
        "ALTER TABLE crm_lead_followups ADD COLUMN adults INT DEFAULT 1 AFTER travel_destination",
        "ALTER TABLE crm_lead_followups ADD COLUMN children INT DEFAULT 0 AFTER adults",
        "ALTER TABLE crm_lead_followups ADD COLUMN infants INT DEFAULT 0 AFTER children",
        "ALTER TABLE crm_lead_followups ADD COLUMN room_details LONGTEXT NULL AFTER total_rooms",
        "ALTER TABLE crm_lead_followups ADD COLUMN package_name VARCHAR(255) NULL AFTER room_details",
        "ALTER TABLE crm_lead_followups ADD COLUMN package_rate VARCHAR(100) NULL AFTER package_name",
        "ALTER TABLE crm_lead_followups ADD COLUMN is_converted TINYINT(1) DEFAULT 0 AFTER package_rate",
        "ALTER TABLE crm_lead_followups ADD COLUMN converted_at DATETIME NULL AFTER is_converted",
        "ALTER TABLE crm_lead_followups ADD COLUMN converted_by INT NULL AFTER converted_at",
        "ALTER TABLE crm_lead_followups ADD COLUMN converted_amount VARCHAR(100) NULL AFTER converted_by",
        "ALTER TABLE crm_lead_followups ADD COLUMN conversion_note TEXT NULL AFTER converted_amount",
        "ALTER TABLE crm_lead_followups ADD INDEX idx_is_converted (is_converted)",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN adults INT DEFAULT 1 AFTER travel_destination",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN children INT DEFAULT 0 AFTER adults",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN infants INT DEFAULT 0 AFTER children",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN room_details LONGTEXT NULL AFTER total_rooms",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN package_name VARCHAR(255) NULL AFTER room_details",
        "ALTER TABLE crm_lead_followup_logs ADD COLUMN package_rate VARCHAR(100) NULL AFTER package_name"
    ];

    migrations.forEach((migrationSql) => {
        connection.query(migrationSql, () => {
            // Silently ignore if column already exists (ER_DUP_FIELDNAME)
        });
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
    adults = null,
    children = null,
    infants = null,
    number_of_persons = 1,
    total_rooms = 1,
    rooms = null,
    room_details = null,
    package_name = '',
    package_rate = '',
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

        const parsedAdults = adults !== null && !isNaN(parseInt(adults)) ? Math.max(0, parseInt(adults)) : (parseInt(number_of_persons) || 1);
        const parsedChildren = children !== null && !isNaN(parseInt(children)) ? Math.max(0, parseInt(children)) : 0;
        const parsedInfants = infants !== null && !isNaN(parseInt(infants)) ? Math.max(0, parseInt(infants)) : 0;
        const totalPax = parsedAdults + parsedChildren + parsedInfants;
        const parsedPersons = Math.max(1, parseInt(number_of_persons) || totalPax || 1);
        const parsedRooms = Math.max(1, parseInt(total_rooms) || 1);

        const effectiveRooms = rooms || room_details;
        let serializedRooms = null;
        if (effectiveRooms) {
            if (typeof effectiveRooms === 'string') {
                serializedRooms = effectiveRooms;
            } else {
                try {
                    serializedRooms = JSON.stringify(effectiveRooms);
                } catch (e) {
                    serializedRooms = null;
                }
            }
        }

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
                        adults = ?,
                        children = ?,
                        infants = ?,
                        number_of_persons = ?,
                        total_rooms = ?,
                        room_details = COALESCE(?, room_details),
                        package_name = ?,
                        package_rate = ?,
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
                        parsedAdults,
                        parsedChildren,
                        parsedInfants,
                        parsedPersons,
                        parsedRooms,
                        serializedRooms,
                        package_name ? package_name.trim() : '',
                        package_rate ? package_rate.trim() : '',
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
                        adults,
                        children,
                        infants,
                        number_of_persons,
                        total_rooms,
                        room_details,
                        package_name,
                        package_rate,
                        extra_note,
                        next_followup_date,
                        last_followup_at,
                        last_followup_by,
                        created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
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
                        parsedAdults,
                        parsedChildren,
                        parsedInfants,
                        parsedPersons,
                        parsedRooms,
                        serializedRooms,
                        package_name ? package_name.trim() : '',
                        package_rate ? package_rate.trim() : '',
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
                    adults,
                    children,
                    infants,
                    number_of_persons,
                    total_rooms,
                    room_details,
                    package_name,
                    package_rate,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
                    parsedAdults,
                    parsedChildren,
                    parsedInfants,
                    parsedPersons,
                    parsedRooms,
                    serializedRooms,
                    package_name ? package_name.trim() : '',
                    package_rate ? package_rate.trim() : ''
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
 * Mark Lead as Converted (Won Deal) and log to audit timeline
 */
function markLeadConvertedModel({
    contact_id,
    converted_amount = '',
    package_name = '',
    conversion_note = '',
    travel_date = null,
    adults = null,
    children = null,
    infants = null,
    number_of_persons = null,
    total_rooms = null,
    rooms = null,
    room_details = null,
    admin_user_id
}) {
    return new Promise(async (resolve, reject) => {
        if (!contact_id) return reject(new Error("Contact ID is required."));
        if (!admin_user_id) return reject(new Error("Admin User ID is required."));

        const formattedTravelDate = formatDateForDb(travel_date);

        const effectiveRooms = rooms || room_details;
        let serializedRooms = null;
        if (effectiveRooms) {
            if (typeof effectiveRooms === 'string') {
                serializedRooms = effectiveRooms;
            } else {
                try {
                    serializedRooms = JSON.stringify(effectiveRooms);
                } catch (e) {
                    serializedRooms = null;
                }
            }
        }

        const parsedAdults = adults !== null && !isNaN(parseInt(adults)) ? parseInt(adults) : null;
        const parsedChildren = children !== null && !isNaN(parseInt(children)) ? parseInt(children) : null;
        const parsedInfants = infants !== null && !isNaN(parseInt(infants)) ? parseInt(infants) : null;
        const parsedPersons = number_of_persons !== null && !isNaN(parseInt(number_of_persons))
            ? parseInt(number_of_persons)
            : (parsedAdults !== null ? (parsedAdults + (parsedChildren || 0) + (parsedInfants || 0)) : null);
        const parsedRooms = total_rooms !== null && !isNaN(parseInt(total_rooms))
            ? parseInt(total_rooms)
            : (Array.isArray(effectiveRooms) ? effectiveRooms.length : null);

        try {
            // 1. Check if followup exists
            const existingFollowupRows = await new Promise((res, rej) => {
                connection.query(`SELECT id, lead_name, phone, package_name, package_rate, travel_destination, adults, children, infants, number_of_persons, total_rooms, room_details FROM crm_lead_followups WHERE contact_id = ? LIMIT 1`, [contact_id], (err, rows) => {
                    if (err) return rej(err);
                    res(rows || []);
                });
            });

            let followupId = null;
            let currentFollowup = null;

            if (existingFollowupRows.length > 0) {
                currentFollowup = existingFollowupRows[0];
                followupId = currentFollowup.id;

                const updateSql = `
                    UPDATE crm_lead_followups
                    SET 
                        is_converted = 1,
                        converted_at = NOW(),
                        converted_by = ?,
                        converted_amount = ?,
                        package_name = COALESCE(NULLIF(?, ''), package_name),
                        package_rate = COALESCE(NULLIF(?, ''), package_rate),
                        conversion_note = ?,
                        travel_date = COALESCE(?, travel_date),
                        adults = COALESCE(?, adults),
                        children = COALESCE(?, children),
                        infants = COALESCE(?, infants),
                        number_of_persons = COALESCE(?, number_of_persons),
                        total_rooms = COALESCE(?, total_rooms),
                        room_details = COALESCE(?, room_details),
                        last_followup_at = NOW(),
                        last_followup_by = ?
                    WHERE id = ?
                `;

                await new Promise((res, rej) => {
                    connection.query(updateSql, [
                        admin_user_id,
                        converted_amount ? String(converted_amount).trim() : (currentFollowup.package_rate || ''),
                        package_name ? package_name.trim() : '',
                        converted_amount ? String(converted_amount).trim() : '',
                        conversion_note ? conversion_note.trim() : '',
                        formattedTravelDate,
                        parsedAdults,
                        parsedChildren,
                        parsedInfants,
                        parsedPersons,
                        parsedRooms,
                        serializedRooms,
                        admin_user_id,
                        followupId
                    ], (err, result) => {
                        if (err) return rej(err);
                        res(result);
                    });
                });
            } else {
                // If follow-up didn't exist yet, fetch contact details and create converted record
                const contactRows = await new Promise((res, rej) => {
                    connection.query(`SELECT id, wa_id, name FROM whatsapp_contacts WHERE id = ? LIMIT 1`, [contact_id], (err, rows) => {
                        if (err) return rej(err);
                        res(rows || []);
                    });
                });

                if (contactRows.length === 0) {
                    return reject(new Error("Contact not found."));
                }

                const contact = contactRows[0];
                const insertSql = `
                    INSERT INTO crm_lead_followups (
                        contact_id,
                        lead_name,
                        phone,
                        is_converted,
                        converted_at,
                        converted_by,
                        converted_amount,
                        package_name,
                        package_rate,
                        conversion_note,
                        travel_date,
                        adults,
                        children,
                        infants,
                        number_of_persons,
                        total_rooms,
                        room_details,
                        last_followup_at,
                        last_followup_by,
                        created_by
                    ) VALUES (?, ?, ?, 1, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
                `;

                const insertRes = await new Promise((res, rej) => {
                    connection.query(insertSql, [
                        contact_id,
                        contact.name || `Lead ${contact.wa_id}`,
                        contact.wa_id,
                        admin_user_id,
                        converted_amount ? String(converted_amount).trim() : '',
                        package_name ? package_name.trim() : '',
                        converted_amount ? String(converted_amount).trim() : '',
                        conversion_note ? conversion_note.trim() : '',
                        formattedTravelDate,
                        parsedAdults || 1,
                        parsedChildren || 0,
                        parsedInfants || 0,
                        parsedPersons || 1,
                        parsedRooms || 1,
                        serializedRooms,
                        admin_user_id,
                        admin_user_id
                    ], (err, result) => {
                        if (err) return rej(err);
                        res(result);
                    });
                });
                followupId = insertRes.insertId;
            }

            // 2. Audit Timeline Log
            const logNote = `🎉 LEAD CONVERTED / WON DEAL! Agreed Amount: ₹${converted_amount || 'N/A'}. Package: ${package_name || currentFollowup?.package_name || 'Standard'}. Note: ${conversion_note || 'Successfully converted lead.'}`;

            const insertLogSql = `
                INSERT INTO crm_lead_followup_logs (
                    followup_id,
                    contact_id,
                    admin_user_id,
                    lead_type,
                    note,
                    package_name,
                    package_rate,
                    travel_date,
                    travel_destination,
                    adults,
                    children,
                    infants,
                    number_of_persons,
                    total_rooms,
                    room_details,
                    created_at
                ) VALUES (?, ?, ?, 'converted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            await new Promise((res, rej) => {
                connection.query(insertLogSql, [
                    followupId,
                    contact_id,
                    admin_user_id,
                    logNote,
                    package_name || currentFollowup?.package_name || '',
                    converted_amount || currentFollowup?.package_rate || '',
                    formattedTravelDate || currentFollowup?.travel_date || null,
                    currentFollowup?.travel_destination || 'Sundarban',
                    parsedAdults !== null ? parsedAdults : (currentFollowup?.adults || 1),
                    parsedChildren !== null ? parsedChildren : (currentFollowup?.children || 0),
                    parsedInfants !== null ? parsedInfants : (currentFollowup?.infants || 0),
                    parsedPersons !== null ? parsedPersons : (currentFollowup?.number_of_persons || 1),
                    parsedRooms !== null ? parsedRooms : (currentFollowup?.total_rooms || 1),
                    serializedRooms || currentFollowup?.room_details || null
                ], (err, result) => {
                    if (err) return rej(err);
                    res(result);
                });
            });

            resolve({
                success: true,
                contact_id,
                followup_id: followupId,
                is_converted: 1
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Reopen / Unconvert Lead back to Active Pipeline
 */
function unmarkLeadConvertedModel({
    contact_id,
    admin_user_id
}) {
    return new Promise(async (resolve, reject) => {
        if (!contact_id) return reject(new Error("Contact ID is required."));
        if (!admin_user_id) return reject(new Error("Admin User ID is required."));

        try {
            await new Promise((res, rej) => {
                connection.query(`UPDATE crm_lead_followups SET is_converted = 0, last_followup_at = NOW(), last_followup_by = ? WHERE contact_id = ?`, [admin_user_id, contact_id], (err, result) => {
                    if (err) return rej(err);
                    res(result);
                });
            });

            // Insert audit log
            const insertLogSql = `
                INSERT INTO crm_lead_followup_logs (
                    contact_id,
                    admin_user_id,
                    lead_type,
                    note,
                    created_at
                ) VALUES (?, ?, 'warm', 'Lead re-opened from Converted status to Active Follow-up.', NOW())
            `;
            await new Promise((res) => {
                connection.query(insertLogSql, [contact_id, admin_user_id], () => res());
            });

            resolve({
                success: true,
                contact_id,
                is_converted: 0
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
    contact_id = '',
    search = '',
    lead_type = '',
    is_today_only = false,
    is_converted = 'false',
    from_date = '',
    to_date = '',
    date_filter_type = 'next_followup', // 'next_followup' or 'travel_date' or 'last_followup' or 'converted_at'
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

        // 1b. Specific contact_id filter
        if (contact_id && !isNaN(Number(contact_id))) {
            conditions.push(`f.contact_id = ?`);
            params.push(Number(contact_id));
        }

        // 2. Converted vs Active Leads Filter
        const isConvertedFilter = is_converted === 'true' || is_converted === true || is_converted === '1' || lead_type === 'converted';
        if (isConvertedFilter) {
            conditions.push(`f.is_converted = 1`);
        } else if (!contact_id) {
            // Default: STRICTLY ONLY active follow-ups (converted leads are excluded) when not querying specific contact_id
            conditions.push(`(f.is_converted = 0 OR f.is_converted IS NULL)`);
        }

        // 3. Lead Type filter (hot, warm, cold)
        if (lead_type && ['hot', 'warm', 'cold'].includes(String(lead_type).toLowerCase())) {
            conditions.push(`f.lead_type = ?`);
            params.push(String(lead_type).toLowerCase());
        }

        // 4. Quick Today Filter
        if (String(is_today_only) === 'true' || is_today_only === true) {
            conditions.push(`f.next_followup_date = CURDATE()`);
        }

        // 5. Date range filter (from_date to to_date)
        const targetDateField = date_filter_type === 'travel_date' 
            ? 'f.travel_date' 
            : (date_filter_type === 'last_followup' ? 'DATE(f.last_followup_at)' 
            : (date_filter_type === 'converted_at' ? 'DATE(f.converted_at)' : 'f.next_followup_date'));

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

        // 6. Search filter (Lead Name, Phone, Destination, Package Name, Notes)
        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push(`(
                f.lead_name LIKE ? 
                OR c.name LIKE ? 
                OR f.phone LIKE ? 
                OR c.wa_id LIKE ? 
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
                f.id AS followup_id,
                f.contact_id,
                DATE_FORMAT(f.travel_date, '%Y-%m-%d') AS travel_date_str,
                DATE_FORMAT(f.converted_at, '%Y-%m-%d') AS converted_at_str,
                DATE_FORMAT(f.created_at, '%Y-%m-%d') AS followup_created_at_str,
                COALESCE(NULLIF(f.lead_name, ''), c.name, 'WhatsApp Customer') AS lead_name,
                COALESCE(NULLIF(f.phone, ''), c.wa_id) AS phone,
                f.email,
                f.lead_type,
                f.travel_date,
                f.travel_destination,
                f.adults,
                f.children,
                f.infants,
                f.number_of_persons,
                f.total_rooms,
                f.room_details,
                f.package_name,
                f.package_rate,
                f.is_converted,
                f.converted_at,
                f.converted_by,
                f.converted_amount,
                f.conversion_note,
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
                CONCAT(uc.first_name, ' ', COALESCE(uc.last_name, '')) AS converted_by_name,
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
            LEFT JOIN user_master uc ON uc.id = f.converted_by
            ${whereClause}
            ORDER BY 
                ${isConvertedFilter ? 'f.converted_at DESC, f.last_followup_at DESC' : `CASE 
                    WHEN f.next_followup_date = CURDATE() THEN 1
                    WHEN f.next_followup_date < CURDATE() THEN 2
                    WHEN f.next_followup_date > CURDATE() THEN 3
                    ELSE 4
                END ASC,
                f.next_followup_date ASC,
                f.last_followup_at DESC`}
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
                const formattedFollowups = (rows ? JSON.parse(JSON.stringify(rows)) : []).map(row => {
                    let parsedRooms = null;
                    if (row.room_details) {
                        try {
                            parsedRooms = typeof row.room_details === 'string' ? JSON.parse(row.room_details) : row.room_details;
                        } catch (e) {
                            parsedRooms = null;
                        }
                    }
                    return {
                        ...row,
                        adults: row.adults !== null && row.adults !== undefined ? row.adults : (row.number_of_persons || 1),
                        children: row.children || 0,
                        infants: row.infants || 0,
                        rooms: parsedRooms,
                        room_details: parsedRooms
                    };
                });
                resolve({
                    followups: formattedFollowups,
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
    return new Promise(async (resolve, reject) => {
        const isSuperAdmin = requestingUser?.admin === 1;
        const currentUserId = requestingUser?.id;

        let whereClause = '';
        let params = [];

        if (!isSuperAdmin) {
            whereClause = 'WHERE c.assigned_to = ?';
            params.push(currentUserId);
        }

        const sql = `
            SELECT 
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) THEN 1 ELSE 0 END) AS total_followups,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.next_followup_date = CURDATE() THEN 1 ELSE 0 END) AS today_followups,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.next_followup_date < CURDATE() AND f.next_followup_date IS NOT NULL THEN 1 ELSE 0 END) AS overdue_followups,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.next_followup_date > CURDATE() THEN 1 ELSE 0 END) AS upcoming_followups,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.lead_type = 'hot' THEN 1 ELSE 0 END) AS hot_leads,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.lead_type = 'warm' THEN 1 ELSE 0 END) AS warm_leads,
                SUM(CASE WHEN (f.is_converted = 0 OR f.is_converted IS NULL) AND f.lead_type = 'cold' THEN 1 ELSE 0 END) AS cold_leads,
                SUM(CASE WHEN f.is_converted = 1 THEN 1 ELSE 0 END) AS converted_leads
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
                cold_leads: Number(stats.cold_leads || 0),
                converted_leads: Number(stats.converted_leads || 0)
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
                l.adults,
                l.children,
                l.infants,
                l.number_of_persons,
                l.total_rooms,
                l.room_details,
                l.package_name,
                l.package_rate,
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
            const formattedLogs = (rows ? JSON.parse(JSON.stringify(rows)) : []).map(log => {
                let parsedRooms = null;
                if (log.room_details) {
                    try {
                        parsedRooms = typeof log.room_details === 'string' ? JSON.parse(log.room_details) : log.room_details;
                    } catch (e) {
                        parsedRooms = null;
                    }
                }
                return {
                    ...log,
                    adults: log.adults !== null && log.adults !== undefined ? log.adults : (log.number_of_persons || 1),
                    children: log.children || 0,
                    infants: log.infants || 0,
                    rooms: parsedRooms,
                    room_details: parsedRooms
                };
            });
            resolve({
                contact: contact,
                logs: formattedLogs
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
            const rawFollowup = rows && rows.length > 0 ? rows[0] : null;

            let followup = rawFollowup ? JSON.parse(JSON.stringify(rawFollowup)) : null;
            if (followup) {
                let parsedRooms = null;
                if (followup.room_details) {
                    try {
                        parsedRooms = typeof followup.room_details === 'string' ? JSON.parse(followup.room_details) : followup.room_details;
                    } catch (e) {
                        parsedRooms = null;
                    }
                }
                followup.adults = followup.adults !== null && followup.adults !== undefined ? followup.adults : (followup.number_of_persons || 1);
                followup.children = followup.children || 0;
                followup.infants = followup.infants || 0;
                followup.rooms = parsedRooms;
                followup.room_details = parsedRooms;
            }

            // Also fetch recent logs
            const logsData = await getFollowupLogsHistoryModel(contactId, requestingUser);

            resolve({
                contact: contact,
                followup: followup,
                logs: logsData?.logs || []
            });
        });
    });
}

module.exports = {
    initCrmFollowupTables,
    saveLeadFollowupModel,
    markLeadConvertedModel,
    unmarkLeadConvertedModel,
    getFollowupsListModel,
    getFollowupStatsModel,
    getFollowupLogsHistoryModel,
    getSingleLeadFollowupModel
};
