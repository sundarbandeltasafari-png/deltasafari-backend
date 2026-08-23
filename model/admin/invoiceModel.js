const connection = require('../../Connection');

/**
 * Initialize CRM Invoices and Invoice Configuration Tables
 */
function initInvoiceTables() {
    const createConfigSql = `
        CREATE TABLE IF NOT EXISTS crm_invoice_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_name VARCHAR(255) DEFAULT 'DELTA SAFARI',
            tagline VARCHAR(255) DEFAULT 'WHERE EXPECTATIONS MEET REALITY',
            logo_url VARCHAR(255) DEFAULT '',
            address TEXT NULL,
            msme_reg VARCHAR(255) DEFAULT 'UDYAM-WB-18-0109198',
            trade_licence VARCHAR(255) DEFAULT '767',
            mobile_numbers VARCHAR(255) DEFAULT '+91 7029533240 & +91 6297603562',
            email VARCHAR(255) DEFAULT 'sundarban.deltasafari@gmail.com',
            website VARCHAR(255) DEFAULT 'sundarbandeltasafari.com',
            bank_name VARCHAR(255) DEFAULT 'STATE BANK OF INDIA',
            account_holder VARCHAR(255) DEFAULT 'SANDIP HALDER',
            account_number VARCHAR(255) DEFAULT '34193984830',
            ifsc_code VARCHAR(255) DEFAULT 'SBIN0011367',
            upi_id VARCHAR(255) DEFAULT '',
            default_gst_percent DECIMAL(5,2) DEFAULT 0.00,
            terms_conditions TEXT NULL,
            invoice_prefix VARCHAR(50) DEFAULT 'INV-00',
            next_invoice_number INT DEFAULT 30019,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createInvoicesSql = `
        CREATE TABLE IF NOT EXISTS crm_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_no VARCHAR(100) UNIQUE NOT NULL,
            invoice_date DATE NOT NULL,
            contact_id INT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_address VARCHAR(255) DEFAULT 'West Bengal',
            customer_phone VARCHAR(50) NOT NULL,
            customer_email VARCHAR(255) NULL,
            pickup_drop VARCHAR(255) DEFAULT 'Canning',
            number_of_pax INT DEFAULT 1,
            room_required VARCHAR(255) DEFAULT '1 AC',
            food_preference VARCHAR(255) DEFAULT 'Non Veg',
            departure_date_text VARCHAR(255) NULL,
            items_json JSON NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            gst_percent DECIMAL(5,2) DEFAULT 0.00,
            gst_amount DECIMAL(10,2) DEFAULT 0.00,
            discount_amount DECIMAL(10,2) DEFAULT 0.00,
            advance_note VARCHAR(255) DEFAULT '',
            advance_received DECIMAL(10,2) DEFAULT 0.00,
            total_due_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'partial',
            bank_details_text TEXT NULL,
            terms_text TEXT NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_invoice_date (invoice_date),
            INDEX idx_customer_phone (customer_phone),
            INDEX idx_contact_id (contact_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createConfigSql, (err) => {
        if (err) {
            console.error("[Invoice Model] Error initializing crm_invoice_config table:", err.message);
        } else {
            // Seed default configuration if empty
            connection.query(`SELECT id FROM crm_invoice_config LIMIT 1`, (sErr, rows) => {
                if (!sErr && (!rows || rows.length === 0)) {
                    const defaultTerms = `1/ The itinerary is subject to change, modification, or rescheduling due to any disasters, emergencies, restrictions or any other unforeseen circumstances beyond our control.
2/ Rest of the due amount should be paid to the assigned tour manager on day one.
3/ Cancellations made within 30 days of the travel date are non-refundable.
4/ Any action taken by the Forest Department for rule violations will be your responsibility.
5/ Please carry a valid ID card for jungle permit verification and security checks.`;

                    const seedSql = `
                        INSERT INTO crm_invoice_config (
                            company_name, tagline, address, msme_reg, trade_licence,
                            mobile_numbers, email, website, bank_name, account_holder,
                            account_number, ifsc_code, terms_conditions, invoice_prefix, next_invoice_number
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    connection.query(seedSql, [
                        'DELTA SAFARI',
                        'WHERE EXPECTATIONS MEET REALITY',
                        'Canning, Herobhanga, South 24 Parganas- 743329',
                        'UDYAM-WB-18-0109198',
                        '767',
                        '+91 7029533240 & +91 6297603562',
                        'sundarban.deltasafari@gmail.com',
                        'sundarbandeltasafari.com',
                        'STATE BANK OF INDIA',
                        'SANDIP HALDER',
                        '34193984830',
                        'SBIN0011367',
                        defaultTerms,
                        'INV-00',
                        30019
                    ]);
                }
            });
        }
    });

    connection.query(createInvoicesSql, (err) => {
        if (err) console.error("[Invoice Model] Error initializing crm_invoices table:", err.message);
    });
}

initInvoiceTables();

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
 * Get Invoice Configuration
 */
function getInvoiceConfigModel() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM crm_invoice_config ORDER BY id ASC LIMIT 1`;
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            if (rows && rows.length > 0) {
                resolve(JSON.parse(JSON.stringify(rows[0])));
            } else {
                resolve(null);
            }
        });
    });
}

/**
 * Update Invoice Configuration
 */
function updateInvoiceConfigModel(configData) {
    return new Promise(async (resolve, reject) => {
        const {
            company_name = 'DELTA SAFARI',
            tagline = 'WHERE EXPECTATIONS MEET REALITY',
            logo_url = '',
            address = 'Canning, Herobhanga, South 24 Parganas- 743329',
            msme_reg = 'UDYAM-WB-18-0109198',
            trade_licence = '767',
            mobile_numbers = '+91 7029533240 & +91 6297603562',
            email = 'sundarban.deltasafari@gmail.com',
            website = 'sundarbandeltasafari.com',
            bank_name = 'STATE BANK OF INDIA',
            account_holder = 'SANDIP HALDER',
            account_number = '34193984830',
            ifsc_code = 'SBIN0011367',
            upi_id = '',
            default_gst_percent = 0,
            terms_conditions = '',
            invoice_prefix = 'INV-00',
            next_invoice_number = 30019
        } = configData;

        try {
            const existing = await getInvoiceConfigModel();
            if (existing) {
                const updateSql = `
                    UPDATE crm_invoice_config
                    SET 
                        company_name = ?,
                        tagline = ?,
                        logo_url = ?,
                        address = ?,
                        msme_reg = ?,
                        trade_licence = ?,
                        mobile_numbers = ?,
                        email = ?,
                        website = ?,
                        bank_name = ?,
                        account_holder = ?,
                        account_number = ?,
                        ifsc_code = ?,
                        upi_id = ?,
                        default_gst_percent = ?,
                        terms_conditions = ?,
                        invoice_prefix = ?,
                        next_invoice_number = ?,
                        updated_at = NOW()
                    WHERE id = ?
                `;

                connection.query(updateSql, [
                    company_name.trim(),
                    tagline.trim(),
                    logo_url.trim(),
                    address.trim(),
                    msme_reg.trim(),
                    trade_licence.trim(),
                    mobile_numbers.trim(),
                    email.trim(),
                    website.trim(),
                    bank_name.trim(),
                    account_holder.trim(),
                    account_number.trim(),
                    ifsc_code.trim(),
                    upi_id.trim(),
                    parseFloat(default_gst_percent) || 0,
                    terms_conditions.trim(),
                    invoice_prefix.trim(),
                    parseInt(next_invoice_number) || 30019,
                    existing.id
                ], (err) => {
                    if (err) return reject(err);
                    resolve({ ...configData, id: existing.id });
                });
            } else {
                const insertSql = `
                    INSERT INTO crm_invoice_config (
                        company_name, tagline, logo_url, address, msme_reg, trade_licence,
                        mobile_numbers, email, website, bank_name, account_holder,
                        account_number, ifsc_code, upi_id, default_gst_percent, terms_conditions,
                        invoice_prefix, next_invoice_number
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                connection.query(insertSql, [
                    company_name.trim(),
                    tagline.trim(),
                    logo_url.trim(),
                    address.trim(),
                    msme_reg.trim(),
                    trade_licence.trim(),
                    mobile_numbers.trim(),
                    email.trim(),
                    website.trim(),
                    bank_name.trim(),
                    account_holder.trim(),
                    account_number.trim(),
                    ifsc_code.trim(),
                    upi_id.trim(),
                    parseFloat(default_gst_percent) || 0,
                    terms_conditions.trim(),
                    invoice_prefix.trim(),
                    parseInt(next_invoice_number) || 30019
                ], (err, result) => {
                    if (err) return reject(err);
                    resolve({ ...configData, id: result.insertId });
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Next Unique Invoice Number
 */
function getNextInvoiceNumberModel() {
    return new Promise(async (resolve, reject) => {
        try {
            const config = await getInvoiceConfigModel();
            const prefix = config?.invoice_prefix || 'INV-00';
            const nextNum = config?.next_invoice_number || 30019;
            const invoiceNo = `${prefix}${nextNum}`;
            resolve({ invoice_no: invoiceNo, next_num: nextNum, prefix });
        } catch (err) {
            resolve({ invoice_no: `INV-00${Date.now().toString().slice(-5)}`, next_num: 30019, prefix: 'INV-00' });
        }
    });
}

/**
 * Increment Invoice Number Counter
 */
function incrementInvoiceNumberCounter() {
    return new Promise((resolve) => {
        connection.query(`UPDATE crm_invoice_config SET next_invoice_number = next_invoice_number + 1 WHERE id > 0 LIMIT 1`, (err) => {
            resolve(true);
        });
    });
}

/**
 * Create New Invoice
 */
function createInvoiceModel(invoiceData, adminUserId) {
    return new Promise(async (resolve, reject) => {
        const {
            invoice_no,
            invoice_date,
            contact_id = null,
            customer_name,
            customer_address = 'West Bengal',
            customer_phone,
            customer_email = '',
            pickup_drop = 'Canning',
            number_of_pax = 1,
            room_required = '1 AC',
            food_preference = 'Non Veg',
            departure_date_text = '',
            items = [],
            subtotal = 0,
            gst_percent = 0,
            gst_amount = 0,
            discount_amount = 0,
            advance_note = '',
            advance_received = 0,
            total_due_amount = 0,
            payment_status = 'partial',
            bank_details_text = '',
            terms_text = ''
        } = invoiceData;

        if (!customer_name || !customer_name.trim()) {
            return reject(new Error("Customer name is required."));
        }
        if (!customer_phone || !customer_phone.trim()) {
            return reject(new Error("Customer phone number is required."));
        }

        const formattedInvoiceDate = formatDateForDb(invoice_date) || new Date().toISOString().split('T')[0];

        // Format items JSON
        const itemsJsonStr = JSON.stringify(Array.isArray(items) && items.length > 0 ? items : [
            { sn: 1, description: 'Sundarban Safari Package', rate: Number(subtotal) || 0, person: Number(number_of_pax) || 1, amount: Number(subtotal) || 0 }
        ]);

        let finalInvoiceNo = invoice_no;
        if (!finalInvoiceNo || !finalInvoiceNo.trim()) {
            const nextInfo = await getNextInvoiceNumberModel();
            finalInvoiceNo = nextInfo.invoice_no;
        }

        const insertSql = `
            INSERT INTO crm_invoices (
                invoice_no,
                invoice_date,
                contact_id,
                customer_name,
                customer_address,
                customer_phone,
                customer_email,
                pickup_drop,
                number_of_pax,
                room_required,
                food_preference,
                departure_date_text,
                items_json,
                subtotal,
                gst_percent,
                gst_amount,
                discount_amount,
                advance_note,
                advance_received,
                total_due_amount,
                payment_status,
                bank_details_text,
                terms_text,
                created_by,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        connection.query(insertSql, [
            finalInvoiceNo.trim(),
            formattedInvoiceDate,
            contact_id ? Number(contact_id) : null,
            customer_name.trim(),
            customer_address ? customer_address.trim() : 'West Bengal',
            customer_phone.trim(),
            customer_email ? customer_email.trim() : null,
            pickup_drop ? pickup_drop.trim() : 'Canning',
            parseInt(number_of_pax) || 1,
            room_required ? room_required.trim() : '1 AC',
            food_preference ? food_preference.trim() : 'Non Veg',
            departure_date_text ? departure_date_text.trim() : '',
            itemsJsonStr,
            parseFloat(subtotal) || 0,
            parseFloat(gst_percent) || 0,
            parseFloat(gst_amount) || 0,
            parseFloat(discount_amount) || 0,
            advance_note ? advance_note.trim() : '',
            parseFloat(advance_received) || 0,
            parseFloat(total_due_amount) || 0,
            payment_status || 'partial',
            bank_details_text || '',
            terms_text || '',
            adminUserId
        ], async (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return reject(new Error(`Invoice number "${finalInvoiceNo}" already exists. Please use a unique number.`));
                }
                return reject(err);
            }

            // Increment sequence
            await incrementInvoiceNumberCounter();

            resolve({
                id: result.insertId,
                invoice_no: finalInvoiceNo.trim(),
                invoice_date: formattedInvoiceDate,
                customer_name,
                total_due_amount
            });
        });
    });
}

/**
 * Get Invoices List with Search & Pagination
 */
function getInvoicesListModel({
    page = 1,
    limit = 20,
    search = '',
    payment_status = '',
    from_date = '',
    to_date = ''
} = {}) {
    return new Promise((resolve, reject) => {
        let conditions = [];
        let params = [];

        if (payment_status && ['unpaid', 'partial', 'paid'].includes(payment_status)) {
            conditions.push(`i.payment_status = ?`);
            params.push(payment_status);
        }

        const fStart = formatDateForDb(from_date);
        const fEnd = formatDateForDb(to_date);

        if (fStart && fEnd) {
            conditions.push(`i.invoice_date BETWEEN ? AND ?`);
            params.push(fStart, fEnd);
        } else if (fStart) {
            conditions.push(`i.invoice_date >= ?`);
            params.push(fStart);
        } else if (fEnd) {
            conditions.push(`i.invoice_date <= ?`);
            params.push(fEnd);
        }

        if (search && search.trim() !== '') {
            const term = `%${search.trim()}%`;
            conditions.push(`(
                i.invoice_no LIKE ? 
                OR i.customer_name LIKE ? 
                OR i.customer_phone LIKE ? 
                OR i.customer_email LIKE ?
                OR i.departure_date_text LIKE ?
            )`);
            params.push(term, term, term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countSql = `SELECT COUNT(i.id) AS total FROM crm_invoices i ${whereClause}`;

        connection.query(countSql, params, (countErr, countRows) => {
            if (countErr) return reject(countErr);

            const total = countRows && countRows[0] ? countRows[0].total : 0;
            const totalPages = Math.ceil(total / Number(limit)) || 1;
            const offset = (Number(page) - 1) * Number(limit);

            const sql = `
                SELECT 
                    i.id,
                    i.invoice_no,
                    DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,
                    i.contact_id,
                    i.customer_name,
                    i.customer_address,
                    i.customer_phone,
                    i.customer_email,
                    i.pickup_drop,
                    i.number_of_pax,
                    i.room_required,
                    i.food_preference,
                    i.departure_date_text,
                    i.items_json,
                    i.subtotal,
                    i.gst_percent,
                    i.gst_amount,
                    i.discount_amount,
                    i.advance_note,
                    i.advance_received,
                    i.total_due_amount,
                    i.payment_status,
                    i.bank_details_text,
                    i.terms_text,
                    i.created_by,
                    i.created_at,
                    CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name
                FROM crm_invoices i
                LEFT JOIN user_master u ON u.id = i.created_by
                ${whereClause}
                ORDER BY i.id DESC
                LIMIT ? OFFSET ?
            `;

            connection.query(sql, [...params, Number(limit), Number(offset)], (err, rows) => {
                if (err) return reject(err);

                const list = (rows || []).map(row => {
                    let parsedItems = [];
                    try {
                        parsedItems = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json;
                    } catch (e) {
                        parsedItems = [];
                    }
                    return {
                        ...row,
                        items: parsedItems
                    };
                });

                resolve({
                    invoices: JSON.parse(JSON.stringify(list)),
                    total,
                    totalPages,
                    page: Number(page),
                    limit: Number(limit)
                });
            });
        });
    });
}

/**
 * Get Single Invoice Details
 */
function getInvoiceDetailsModel(id) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error("Invoice ID is required."));

        const sql = `
            SELECT 
                i.*,
                DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
                u.email AS created_by_email
            FROM crm_invoices i
            LEFT JOIN user_master u ON u.id = i.created_by
            WHERE i.id = ? OR i.invoice_no = ?
            LIMIT 1
        `;

        connection.query(sql, [id, id], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) {
                return resolve(null);
            }

            const row = rows[0];
            let parsedItems = [];
            try {
                parsedItems = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json;
            } catch (e) {
                parsedItems = [];
            }

            resolve(JSON.parse(JSON.stringify({
                ...row,
                items: parsedItems
            })));
        });
    });
}

/**
 * Delete Invoice
 */
function deleteInvoiceModel(id) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error("Invoice ID is required."));
        connection.query(`DELETE FROM crm_invoices WHERE id = ?`, [id], (err, res) => {
            if (err) return reject(err);
            resolve({ success: true, id });
        });
    });
}

/**
 * Get Billing Stats (Total Billed, Total Collected, Total Outstanding, Invoice Count)
 */
function getBillingStatsModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COUNT(id) AS total_invoices,
                COALESCE(SUM(subtotal + gst_amount - discount_amount), 0) AS total_billed_amount,
                COALESCE(SUM(advance_received), 0) AS total_collected_amount,
                COALESCE(SUM(total_due_amount), 0) AS total_due_amount,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
                SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) AS partial_invoices,
                SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid_invoices
            FROM crm_invoices
        `;
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows.length > 0 ? rows[0] : {
                total_invoices: 0,
                total_billed_amount: 0,
                total_collected_amount: 0,
                total_due_amount: 0,
                paid_invoices: 0,
                partial_invoices: 0,
                unpaid_invoices: 0
            });
        });
    });
}

module.exports = {
    initInvoiceTables,
    getInvoiceConfigModel,
    updateInvoiceConfigModel,
    getNextInvoiceNumberModel,
    createInvoiceModel,
    getInvoicesListModel,
    getInvoiceDetailsModel,
    deleteInvoiceModel,
    getBillingStatsModel
};
