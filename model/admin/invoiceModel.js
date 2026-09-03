const connection = require('../../Connection');
const Razorpay = require('razorpay');
const { sendWhatsAppCloudMessage, normalizePhoneNumber } = require('../../helper/whatsappHelper');
const { saveWhatsAppOutgoingMessage, upsertWhatsAppContact } = require('./whatsappModel');

/**
 * Initialize CRM Invoices, Invoice Configuration & WhatsApp Template Tables
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
            razorpay_key_id VARCHAR(255) DEFAULT 'rzp_test_RQWjJm9q5lEiA8',
            razorpay_key_secret VARCHAR(255) DEFAULT 'XwAWgPdeymk9XLHqndmSD27c',
            auto_send_whatsapp_invoice TINYINT(1) DEFAULT 1,
            default_whatsapp_template_id INT NULL,
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
            package_name VARCHAR(255) NULL,
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
            razorpay_payment_link_id VARCHAR(100) NULL,
            razorpay_payment_url TEXT NULL,
            whatsapp_message_sent TINYINT(1) DEFAULT 0,
            whatsapp_sent_at DATETIME NULL,
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

    const createTemplatesSql = `
        CREATE TABLE IF NOT EXISTS crm_whatsapp_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) DEFAULT 'invoice',
            template_text TEXT NOT NULL,
            is_default TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_is_default (is_default)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createConfigSql, (err) => {
        if (err) {
            console.error("[Invoice Model] Error initializing crm_invoice_config table:", err.message);
        } else {
            // Check missing columns in crm_invoice_config
            const configCols = [
                { name: 'razorpay_key_id', type: "VARCHAR(255) DEFAULT 'rzp_test_RQWjJm9q5lEiA8'" },
                { name: 'razorpay_key_secret', type: "VARCHAR(255) DEFAULT 'XwAWgPdeymk9XLHqndmSD27c'" },
                { name: 'auto_send_whatsapp_invoice', type: "TINYINT(1) DEFAULT 1" },
                { name: 'default_whatsapp_template_id', type: "INT NULL" }
            ];
            configCols.forEach(col => {
                connection.query(`SHOW COLUMNS FROM crm_invoice_config LIKE '${col.name}'`, (cErr, cRows) => {
                    if (!cErr && cRows.length === 0) {
                        connection.query(`ALTER TABLE crm_invoice_config ADD COLUMN ${col.name} ${col.type}`, (aErr) => {
                            if (aErr) console.warn(`[Invoice Model] Error altering config for ${col.name}:`, aErr.message);
                        });
                    }
                });
            });

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
                            account_number, ifsc_code, terms_conditions, invoice_prefix, next_invoice_number,
                            razorpay_key_id, razorpay_key_secret, auto_send_whatsapp_invoice
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
                        30019,
                        process.env.RAZORPAY_KEY_ID || 'rzp_test_RQWjJm9q5lEiA8',
                        process.env.RAZORPAY_KEY_SECRET || 'XwAWgPdeymk9XLHqndmSD27c'
                    ]);
                }
            });
        }
    });

    connection.query(createInvoicesSql, (err) => {
        if (err) {
            console.error("[Invoice Model] Error initializing crm_invoices table:", err.message);
        } else {
            // Check missing columns in crm_invoices
            const invCols = [
                { name: 'package_name', type: "VARCHAR(255) NULL" },
                { name: 'razorpay_payment_link_id', type: "VARCHAR(100) NULL" },
                { name: 'razorpay_payment_url', type: "TEXT NULL" },
                { name: 'whatsapp_message_sent', type: "TINYINT(1) DEFAULT 0" },
                { name: 'whatsapp_sent_at', type: "DATETIME NULL" }
            ];
            invCols.forEach(col => {
                connection.query(`SHOW COLUMNS FROM crm_invoices LIKE '${col.name}'`, (cErr, cRows) => {
                    if (!cErr && cRows.length === 0) {
                        connection.query(`ALTER TABLE crm_invoices ADD COLUMN ${col.name} ${col.type}`, (aErr) => {
                            if (aErr) console.warn(`[Invoice Model] Error altering crm_invoices for ${col.name}:`, aErr.message);
                        });
                    }
                });
            });
        }
    });

    connection.query(createTemplatesSql, (err) => {
        if (err) {
            console.error("[Invoice Model] Error initializing crm_whatsapp_templates table:", err.message);
        } else {
            // Seed default templates if empty
            connection.query(`SELECT id FROM crm_whatsapp_templates LIMIT 1`, (tErr, tRows) => {
                if (!tErr && (!tRows || tRows.length === 0)) {
                    const defaultTemplate1 = `Hello {{customer_name}},

🎉 Greetings from *DELTA SAFARI*! Your Sundarban safari booking has been generated.

Here are your official booking & invoice details:
📄 *Invoice No:* {{invoice_no}}
📦 *Package:* {{package_name}}
👥 *Total Members:* {{pax}}
🏨 *Accommodation:* {{rooms}}
📅 *Booking / Travel Date:* {{departure_date}}
📍 *Pickup & Drop:* {{pickup_drop}}

💰 *Total Package Cost:* ₹{{total_amount}}
💵 *Advance Received:* ₹{{advance_amount}}
💳 *Remaining Due Balance:* ₹{{due_amount}}

👇 *Pay Your Booking Amount Securely via Razorpay Payment Link:*
{{payment_link}}
_(Supports GooglePay, PhonePe, Paytm, UPI, Cards, NetBanking)_

Thank you for choosing *DELTA SAFARI*!

🌐 Website: {{website}}
📞 Support: {{contact_number}}`;

                    const defaultTemplate2 = `Dear {{customer_name}},

Thank you for booking your Sundarban holiday with *DELTA SAFARI*!

📄 *Invoice No:* {{invoice_no}}
📦 *Package:* {{package_name}}
👥 *Guests:* {{pax}}
📅 *Travel Dates:* {{departure_date}}
💰 *Total Amount:* ₹{{total_amount}}
💵 *Advance Required:* ₹{{advance_amount}}

💳 *Click here to pay Advance via Razorpay:*
{{payment_link}}

Please complete payment to confirm your luxury cottage and boat permits.

Best Regards,
*DELTA SAFARI*
📞 {{contact_number}}`;

                    const defaultTemplate3 = `Hello {{customer_name}},

This is a gentle payment reminder for your upcoming safari with *DELTA SAFARI* on *{{departure_date}}*.

📄 *Invoice No:* {{invoice_no}}
📦 *Package:* {{package_name}}
💳 *Due Balance Amount:* ₹{{due_amount}}

👇 Pay securely using this Razorpay link:
{{payment_link}}

Feel free to reply if you need any assistance!
*DELTA SAFARI*`;

                    const seedTemplates = [
                        ['Official Invoice with Razorpay Payment Link', 'Invoice & Booking Confirmation (Default)', 'invoice', defaultTemplate1, 1],
                        ['Advance Payment Request', 'Advance Payment & Package Details', 'invoice', defaultTemplate2, 0],
                        ['Due Payment Reminder', 'Payment Due Balance Reminder', 'invoice', defaultTemplate3, 0]
                    ];

                    seedTemplates.forEach(([name, title, category, text, isDef]) => {
                        connection.query(
                            `INSERT INTO crm_whatsapp_templates (name, title, category, template_text, is_default) VALUES (?, ?, ?, ?, ?)`,
                            [name, title, category, text, isDef]
                        );
                    });
                }
            });
        }
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
 * Generate Razorpay Payment Link
 */
async function createRazorpayPaymentLink({
    keyId,
    keySecret,
    amount,
    currency = 'INR',
    description,
    customerName,
    customerPhone,
    customerEmail,
    invoiceNo,
    invoiceId,
    packageName,
    travelDate
}) {
    const finalKeyId = keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_RQWjJm9q5lEiA8';
    const finalKeySecret = keySecret || process.env.RAZORPAY_KEY_SECRET || 'XwAWgPdeymk9XLHqndmSD27c';

    const rzp = new Razorpay({
        key_id: finalKeyId,
        key_secret: finalKeySecret
    });

    const payableAmount = Math.max(1, Math.round(Number(amount) || 1));
    const amountInPaise = payableAmount * 100;
    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '').slice(-10) : '';

    try {
        const linkPayload = {
            amount: amountInPaise,
            currency: currency || 'INR',
            accept_partial: false,
            description: description || `Delta Safari Booking Invoice #${invoiceNo}`,
            customer: {
                name: customerName || 'Valued Guest',
                contact: cleanPhone ? `+91${cleanPhone}` : undefined,
                email: customerEmail || undefined
            },
            notify: {
                sms: false,
                email: false
            },
            reminder_enable: true,
            notes: {
                invoice_no: String(invoiceNo || ''),
                invoice_id: String(invoiceId || ''),
                package_name: String(packageName || ''),
                travel_date: String(travelDate || '')
            },
            callback_url: 'https://sundarbandeltasafari.com/booking-success',
            callback_method: 'get'
        };

        if (!linkPayload.customer.contact) delete linkPayload.customer.contact;
        if (!linkPayload.customer.email) delete linkPayload.customer.email;

        const response = await rzp.paymentLink.create(linkPayload);
        return {
            success: true,
            payment_link_id: response.id,
            payment_url: response.short_url || response.url || `https://rzp.io/i/${response.id}`,
            amount: payableAmount,
            raw: response
        };
    } catch (err) {
        console.error('[Invoice Razorpay Payment Link Error]:', err.message || err);
        const fallbackUrl = `https://sundarbandeltasafari.com/pay?invoice=${encodeURIComponent(invoiceNo || '')}&amount=${payableAmount}`;
        return {
            success: false,
            payment_link_id: null,
            payment_url: fallbackUrl,
            amount: payableAmount,
            error: err.message || 'Error creating Razorpay payment link'
        };
    }
}

/**
 * Render WhatsApp Message Template with placeholder values
 */
function renderWhatsAppTemplate(templateText, data = {}) {
    if (!templateText) return '';
    let rendered = templateText;

    const replacements = {
        '{{customer_name}}': data.customer_name || 'Customer',
        '{{customer_phone}}': data.customer_phone || '',
        '{{invoice_no}}': data.invoice_no || '',
        '{{invoice_date}}': data.invoice_date || '',
        '{{package_name}}': data.package_name || 'Sundarban Safari Tour',
        '{{pax}}': data.number_of_pax ? `${data.number_of_pax} Person(s)` : '1 Person',
        '{{rooms}}': data.room_required || '1 Room',
        '{{departure_date}}': data.departure_date_text || data.travel_date || 'As scheduled',
        '{{booking_date}}': data.departure_date_text || data.travel_date || data.invoice_date || 'As scheduled',
        '{{pickup_drop}}': data.pickup_drop || 'Canning',
        '{{total_amount}}': Number(data.subtotal || data.total_amount || 0).toLocaleString('en-IN'),
        '{{advance_amount}}': Number(data.advance_received || 0).toLocaleString('en-IN'),
        '{{due_amount}}': Number(data.total_due_amount || 0).toLocaleString('en-IN'),
        '{{advance_note}}': data.advance_note || '',
        '{{payment_link}}': data.payment_url || data.razorpay_payment_url || 'https://sundarbandeltasafari.com',
        '{{company_name}}': data.company_name || 'DELTA SAFARI',
        '{{tagline}}': data.tagline || 'WHERE EXPECTATIONS MEET REALITY',
        '{{website}}': data.website || 'sundarbandeltasafari.com',
        '{{contact_number}}': data.mobile_numbers || '+91 7029533240'
    };

    for (const [key, value] of Object.entries(replacements)) {
        rendered = rendered.split(key).join(value);
    }

    return rendered;
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
            next_invoice_number = 30019,
            razorpay_key_id = 'rzp_test_RQWjJm9q5lEiA8',
            razorpay_key_secret = 'XwAWgPdeymk9XLHqndmSD27c',
            auto_send_whatsapp_invoice = 1,
            default_whatsapp_template_id = null
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
                        razorpay_key_id = ?,
                        razorpay_key_secret = ?,
                        auto_send_whatsapp_invoice = ?,
                        default_whatsapp_template_id = ?,
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
                    razorpay_key_id.trim(),
                    razorpay_key_secret.trim(),
                    auto_send_whatsapp_invoice ? 1 : 0,
                    default_whatsapp_template_id ? Number(default_whatsapp_template_id) : null,
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
                        invoice_prefix, next_invoice_number, razorpay_key_id, razorpay_key_secret,
                        auto_send_whatsapp_invoice, default_whatsapp_template_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    parseInt(next_invoice_number) || 30019,
                    razorpay_key_id.trim(),
                    razorpay_key_secret.trim(),
                    auto_send_whatsapp_invoice ? 1 : 0,
                    default_whatsapp_template_id ? Number(default_whatsapp_template_id) : null
                ], (err, res) => {
                    if (err) return reject(err);
                    resolve({ ...configData, id: res.insertId });
                });
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * WhatsApp Template Models
 */
function getWhatsAppTemplatesModel({ category = '' } = {}) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM crm_whatsapp_templates`;
        let params = [];
        if (category) {
            sql += ` WHERE category = ?`;
            params.push(category);
        }
        sql += ` ORDER BY is_default DESC, id ASC`;
        connection.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows ? JSON.parse(JSON.stringify(rows)) : []);
        });
    });
}

function getWhatsAppTemplateByIdModel(id) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM crm_whatsapp_templates WHERE id = ? LIMIT 1`, [id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows.length > 0 ? JSON.parse(JSON.stringify(rows[0])) : null);
        });
    });
}

function createWhatsAppTemplateModel({ name, title, category = 'invoice', template_text, is_default = 0 }) {
    return new Promise((resolve, reject) => {
        if (!name || !template_text) {
            return reject(new Error('Template Name and Template Message Text are required.'));
        }

        const insert = () => {
            const sql = `
                INSERT INTO crm_whatsapp_templates (name, title, category, template_text, is_default)
                VALUES (?, ?, ?, ?, ?)
            `;
            connection.query(sql, [name.trim(), title ? title.trim() : name.trim(), category, template_text.trim(), is_default ? 1 : 0], (err, res) => {
                if (err) return reject(err);
                resolve({ id: res.insertId, name, title, category, template_text, is_default });
            });
        };

        if (is_default) {
            connection.query(`UPDATE crm_whatsapp_templates SET is_default = 0 WHERE category = ?`, [category], () => {
                insert();
            });
        } else {
            insert();
        }
    });
}

function updateWhatsAppTemplateModel(id, { name, title, category = 'invoice', template_text, is_default = 0 }) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error('Template ID is required.'));

        const update = () => {
            const sql = `
                UPDATE crm_whatsapp_templates
                SET name = ?, title = ?, category = ?, template_text = ?, is_default = ?, updated_at = NOW()
                WHERE id = ?
            `;
            connection.query(sql, [name.trim(), title ? title.trim() : name.trim(), category, template_text.trim(), is_default ? 1 : 0, id], (err) => {
                if (err) return reject(err);
                resolve({ id, name, title, category, template_text, is_default });
            });
        };

        if (is_default) {
            connection.query(`UPDATE crm_whatsapp_templates SET is_default = 0 WHERE category = ? AND id != ?`, [category, id], () => {
                update();
            });
        } else {
            update();
        }
    });
}

function deleteWhatsAppTemplateModel(id) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error('Template ID is required.'));
        connection.query(`DELETE FROM crm_whatsapp_templates WHERE id = ?`, [id], (err) => {
            if (err) return reject(err);
            resolve({ success: true, id });
        });
    });
}

/**
 * Get Next Invoice Number in format: INV-YYYY-MM-XXXXXX
 * (First 'INV', then 4-digit Year, then 2-digit Month, then 6-digit random number)
 * Example: INV-2026-09-056962
 */
function getNextInvoiceNumberModel() {
    return new Promise((resolve, reject) => {
        try {
            const now = new Date();
            // Format year and month in Asia/Kolkata timezone
            const yearStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric'
            }).format(now);

            const monthStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                month: '2-digit'
            }).format(now);

            const generateCandidate = () => {
                const randomSixDigit = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
                return `INV-${yearStr}-${monthStr}-${randomSixDigit}`;
            };

            const attemptGeneration = (attempts = 0) => {
                if (attempts > 15) {
                    const fallbackCode = String(Date.now()).slice(-6);
                    const fallback = `INV-${yearStr}-${monthStr}-${fallbackCode}`;
                    return resolve({
                        invoice_no: fallback,
                        prefix: 'INV',
                        year: yearStr,
                        month: monthStr,
                        random_code: fallbackCode
                    });
                }

                const candidateNo = generateCandidate();
                connection.query(
                    `SELECT id FROM crm_invoices WHERE invoice_no = ? LIMIT 1`,
                    [candidateNo],
                    (err, rows) => {
                        if (!err && rows && rows.length > 0) {
                            return attemptGeneration(attempts + 1);
                        }
                        const randomPart = candidateNo.split('-')[3];
                        resolve({
                            invoice_no: candidateNo,
                            prefix: 'INV',
                            year: yearStr,
                            month: monthStr,
                            random_code: randomPart
                        });
                    }
                );
            };

            attemptGeneration();
        } catch (error) {
            reject(error);
        }
    });
}

function incrementInvoiceNumberCounter() {
    return new Promise((resolve) => {
        resolve(true);
    });
}

/**
 * Auto-Settle CRM Invoice when Razorpay Payment Link or Payment is Captured
 */
function autoSettleInvoiceFromRazorpay({ paymentLinkId, paymentId, amount, invoiceNo, notes = {}, rawEvent = '' }) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`[Auto-Settle CRM Invoice] Initiating settlement for Payment Link: ${paymentLinkId || 'N/A'}, Invoice: ${invoiceNo || 'N/A'}, Pay ID: ${paymentId || 'N/A'}`);

            let querySql = '';
            let queryParams = [];

            if (paymentLinkId) {
                querySql = `SELECT * FROM crm_invoices WHERE razorpay_payment_link_id = ? LIMIT 1`;
                queryParams = [paymentLinkId];
            } else if (invoiceNo) {
                querySql = `SELECT * FROM crm_invoices WHERE invoice_no = ? LIMIT 1`;
                queryParams = [invoiceNo];
            } else if (notes && notes.invoice_no) {
                querySql = `SELECT * FROM crm_invoices WHERE invoice_no = ? LIMIT 1`;
                queryParams = [notes.invoice_no];
            } else if (notes && notes.invoice_id) {
                querySql = `SELECT * FROM crm_invoices WHERE id = ? LIMIT 1`;
                queryParams = [notes.invoice_id];
            } else {
                return resolve({ success: false, msg: 'No matching payment link ID or invoice number found in payload.' });
            }

            connection.query(querySql, queryParams, async (err, rows) => {
                if (err) {
                    console.error('[Auto-Settle CRM Invoice Error]:', err);
                    return reject(err);
                }

                if (!rows || rows.length === 0) {
                    console.warn(`[Auto-Settle CRM Invoice] No invoice record found matching query: ${queryParams[0]}`);
                    return resolve({ success: false, msg: `Invoice not found for identifier: ${queryParams[0]}` });
                }

                const invoice = rows[0];

                // Check if already fully settled
                if (invoice.payment_status === 'paid') {
                    console.log(`[Auto-Settle CRM Invoice] Invoice #${invoice.invoice_no} is already marked as PAID.`);
                    return resolve({ success: true, already_settled: true, invoice });
                }

                // Determine amount paid (convert paise to rupees if necessary)
                const paidAmtRupees = amount 
                    ? (amount > 100000 ? amount / 100 : (amount >= 1 ? amount : parseFloat(invoice.total_due_amount) || 0)) 
                    : (parseFloat(invoice.total_due_amount) || parseFloat(invoice.subtotal) || 0);

                const currentAdvance = parseFloat(invoice.advance_received) || 0;
                const currentDue = parseFloat(invoice.total_due_amount) || 0;

                const newAdvance = currentAdvance + paidAmtRupees;
                const newDue = Math.max(0, currentDue - paidAmtRupees);
                const newStatus = newDue <= 0 ? 'paid' : 'partial';

                // 1. Update Invoice status & amounts in crm_invoices
                const payNote = `Auto-settled via Razorpay Webhook (Pay ID: ${paymentId || 'N/A'}, Link ID: ${paymentLinkId || 'N/A'})`;
                const updateInvoiceSql = `
                    UPDATE crm_invoices 
                    SET payment_status = ?, 
                        payment_method = 'Razorpay',
                        payment_note = ?,
                        payment_verified_at = NOW(),
                        advance_received = ?, 
                        total_due_amount = ?, 
                        updated_at = NOW() 
                    WHERE id = ?
                `;
                connection.query(updateInvoiceSql, [newStatus, payNote, newAdvance, newDue, invoice.id], async (uErr) => {
                    if (uErr) {
                        console.error('[Auto-Settle CRM Invoice Error updating invoice]:', uErr);
                        return reject(uErr);
                    }

                    // Insert audit record in crm_invoice_payments
                    connection.query(
                        `INSERT INTO crm_invoice_payments (invoice_id, payment_status, payment_method, amount, payment_note, recorded_by, created_at)
                         VALUES (?, ?, 'Razorpay', ?, ?, NULL, NOW())`,
                        [invoice.id, newStatus, paidAmtRupees, payNote],
                        () => {}
                    );

                    console.log(`🎉 [Auto-Settle CRM Invoice] SUCCESS: Invoice #${invoice.invoice_no} updated to '${newStatus}'! Advance: ₹${newAdvance}, Due: ₹${newDue}`);

                    // 2. If connected to a contact / CRM lead, update crm_lead_followups
                    if (invoice.contact_id) {
                        const noteAppend = `\n[Razorpay Auto-Settled: Received ₹${paidAmtRupees.toLocaleString('en-IN')} (Txn: ${paymentId || paymentLinkId || 'Razorpay'}) on ${new Date().toLocaleDateString('en-IN')}]`;
                        connection.query(
                            `UPDATE crm_lead_followups 
                             SET is_converted = 1, 
                                 converted_at = COALESCE(converted_at, NOW()), 
                                 converted_amount = COALESCE(NULLIF(converted_amount, ''), ?),
                                 conversion_note = CONCAT(COALESCE(conversion_note, ''), ?),
                                 updated_at = NOW() 
                             WHERE contact_id = ?`,
                            [newAdvance, noteAppend, invoice.contact_id],
                            (fErr) => {
                                if (fErr) console.warn('[Auto-Settle CRM Invoice] Followup update notice:', fErr.message);
                            }
                        );

                        // 3. Log to crm_lead_followup_logs
                        connection.query(
                            `INSERT INTO crm_lead_followup_logs (contact_id, followup_type, note, created_by, created_at)
                             VALUES (?, 'payment_received', ?, 1, NOW())`,
                            [invoice.contact_id, `Auto-settled via Razorpay payment link. Status: ${newStatus}, Amount: ₹${paidAmtRupees}`],
                            () => {}
                        );
                    }

                    // 4. Send automated payment receipt confirmation to Customer on WhatsApp
                    try {
                        const cleanPhone = invoice.customer_phone ? invoice.customer_phone.replace(/\\D/g, '').slice(-10) : '';
                        if (cleanPhone) {
                            const confMsg = `🎉 *Payment Confirmed & Settled!* \\n\\nDear *${invoice.customer_name}*,\\n\\nWe have successfully received your payment of *₹${paidAmtRupees.toLocaleString('en-IN')}* for Invoice *#${invoice.invoice_no}* via Razorpay.\\n\\n` +
                                (newDue <= 0 
                                    ? `✅ *Payment Status:* FULLY PAID\\nRemaining Balance: ₹0.00\\n\\nYour Sundarban Safari reservation is now officially confirmed!` 
                                    : `⏳ *Payment Status:* PARTIALLY PAID\\nRemaining Balance Due: ₹${newDue.toLocaleString('en-IN')}`) +
                                `\\n\\nThank you for choosing *Delta Safari*! For any queries, feel free to reply to this message.`;

                            const { saveWhatsAppOutgoingMessage, upsertWhatsAppContact } = require('./whatsappModel');
                            const { sendWhatsAppCloudMessage } = require('../../helper/whatsappHelper');
                            sendWhatsAppCloudMessage(cleanPhone, confMsg).then(async (sendRes) => {
                                const contactRec = await upsertWhatsAppContact(cleanPhone, invoice.customer_name);
                                if (contactRec?.id) {
                                    saveWhatsAppOutgoingMessage({
                                        contactId: contactRec.id,
                                        messageId: sendRes?.messageId || null,
                                        messageText: confMsg
                                    });
                                }
                            }).catch(console.warn);
                        }
                    } catch (msgErr) {
                        console.warn('[Auto-Settle CRM Invoice] WhatsApp receipt notice:', msgErr.message);
                    }

                    resolve({
                        success: true,
                        invoice_id: invoice.id,
                        invoice_no: invoice.invoice_no,
                        new_status: newStatus,
                        paid_amount: paidAmtRupees,
                        advance_received: newAdvance,
                        total_due: newDue
                    });
                });
            });
        } catch (error) {
            console.error('[Auto-Settle CRM Invoice Exception]:', error);
            reject(error);
        }
    });
}

/**
 * Create New Invoice with Razorpay Payment Link and automated WhatsApp Delivery
 */
function createInvoiceModel(invoiceData, adminUserId) {
    return new Promise(async (resolve, reject) => {
        const {
            invoice_no,
            invoice_date,
            contact_id,
            customer_name,
            customer_address,
            customer_phone,
            customer_email,
            pickup_drop,
            package_name,
            number_of_pax,
            room_required,
            food_preference,
            departure_date_text,
            items,
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
            send_whatsapp = true,
            template_id = null
        } = invoiceData;

        if (!customer_name || !customer_name.trim()) {
            return reject(new Error("Customer name is required."));
        }
        if (!customer_phone || !customer_phone.trim()) {
            return reject(new Error("Customer phone number is required."));
        }

        let finalInvoiceNo = invoice_no;
        if (!finalInvoiceNo || !finalInvoiceNo.trim()) {
            const nextData = await getNextInvoiceNumberModel();
            finalInvoiceNo = nextData.invoice_no;
        }

        let itemsJsonStr = '[]';
        let extractedPackage = package_name || '';
        try {
            if (Array.isArray(items)) {
                itemsJsonStr = JSON.stringify(items);
                if (!extractedPackage && items.length > 0) {
                    extractedPackage = items[0].description || '';
                }
            } else if (typeof items === 'string') {
                itemsJsonStr = items;
            }
        } catch (e) {
            itemsJsonStr = '[]';
        }

        const formattedInvoiceDate = formatDateForDb(invoice_date) || new Date().toISOString().split('T')[0];

        // 1. Fetch Config for Razorpay & WhatsApp settings
        const config = await getInvoiceConfigModel();

        // 2. Determine payment link payable amount (Due amount if > 0, else Advance or Subtotal)
        const dueVal = parseFloat(total_due_amount) || 0;
        const advVal = parseFloat(advance_received) || 0;
        const subVal = parseFloat(subtotal) || 0;
        const payableLinkAmount = dueVal > 0 ? dueVal : (advVal > 0 ? advVal : subVal);

        // 3. Generate Razorpay Payment Link
        const razorpayResult = await createRazorpayPaymentLink({
            keyId: config?.razorpay_key_id,
            keySecret: config?.razorpay_key_secret,
            amount: payableLinkAmount,
            description: `Delta Safari Booking Invoice #${finalInvoiceNo.trim()} (${extractedPackage || 'Sundarban Tour'})`,
            customerName: customer_name.trim(),
            customerPhone: customer_phone.trim(),
            customerEmail: customer_email ? customer_email.trim() : null,
            invoiceNo: finalInvoiceNo.trim(),
            packageName: extractedPackage,
            travelDate: departure_date_text
        });

        const paymentUrl = razorpayResult.payment_url;
        const paymentLinkId = razorpayResult.payment_link_id;

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
                package_name,
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
                razorpay_payment_link_id,
                razorpay_payment_url,
                bank_details_text,
                terms_text,
                created_by,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
            extractedPackage.trim(),
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
            payment_status || 'pending',
            paymentLinkId,
            paymentUrl,
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

            const invoiceId = result.insertId;

            // Increment sequence
            await incrementInvoiceNumberCounter();

            let whatsappSent = false;
            let whatsappMessageText = '';

            // 4. Send WhatsApp Notification if requested
            const shouldSendWhatsApp = send_whatsapp !== false && (config?.auto_send_whatsapp_invoice !== 0);
            if (shouldSendWhatsApp) {
                try {
                    // Fetch Template
                    let templateRecord = null;
                    if (template_id) {
                        templateRecord = await getWhatsAppTemplateByIdModel(template_id);
                    }
                    if (!templateRecord && config?.default_whatsapp_template_id) {
                        templateRecord = await getWhatsAppTemplateByIdModel(config.default_whatsapp_template_id);
                    }
                    if (!templateRecord) {
                        const templates = await getWhatsAppTemplatesModel({ category: 'invoice' });
                        templateRecord = templates.find(t => t.is_default === 1) || templates[0];
                    }

                    const templateRawText = templateRecord ? templateRecord.template_text : `Hello {{customer_name}}, here is your safari invoice {{invoice_no}} for {{package_name}} on {{departure_date}}. Pay here: {{payment_link}}`;

                    whatsappMessageText = renderWhatsAppTemplate(templateRawText, {
                        ...invoiceData,
                        invoice_no: finalInvoiceNo.trim(),
                        package_name: extractedPackage,
                        payment_url: paymentUrl,
                        razorpay_payment_url: paymentUrl,
                        company_name: config?.company_name || 'DELTA SAFARI',
                        tagline: config?.tagline || 'WHERE EXPECTATIONS MEET REALITY',
                        website: config?.website || 'sundarbandeltasafari.com',
                        mobile_numbers: config?.mobile_numbers || '+91 7029533240'
                    });

                    const cleanPhone = normalizePhoneNumber(customer_phone);
                    const cloudRes = await sendWhatsAppCloudMessage(cleanPhone, whatsappMessageText);

                    // Upsert contact and log message
                    const contactRecord = await upsertWhatsAppContact(cleanPhone, customer_name.trim());
                    if (contactRecord?.id) {
                        await saveWhatsAppOutgoingMessage({
                            contactId: contactRecord.id,
                            messageId: cloudRes?.messageId || null,
                            messageText: whatsappMessageText
                        });
                    }

                    // Update invoice sent flag
                    connection.query(
                        `UPDATE crm_invoices SET whatsapp_message_sent = 1, whatsapp_sent_at = NOW() WHERE id = ?`,
                        [invoiceId]
                    );

                    whatsappSent = cloudRes?.success || false;
                } catch (wErr) {
                    console.error('[Create Invoice WhatsApp Dispatch Error]:', wErr.message || wErr);
                }
            }

            resolve({
                id: invoiceId,
                invoice_no: finalInvoiceNo.trim(),
                invoice_date: formattedInvoiceDate,
                customer_name,
                total_due_amount,
                package_name: extractedPackage,
                payment_url: paymentUrl,
                payment_link_id: paymentLinkId,
                whatsapp_sent: whatsappSent,
                whatsapp_message: whatsappMessageText
            });
        });
    });
}

/**
 * Send WhatsApp Invoice on-demand / Re-send
 */
function sendInvoiceWhatsAppModel(invoiceId, { template_id = null, custom_message = '', payment_amount = null } = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            const invoice = await getInvoiceDetailsModel(invoiceId);
            if (!invoice) {
                return reject(new Error('Invoice not found.'));
            }

            const config = await getInvoiceConfigModel();

            // Check if Razorpay link needs regeneration
            let paymentUrl = invoice.razorpay_payment_url;
            if (!paymentUrl || payment_amount) {
                const payableAmt = payment_amount ? Number(payment_amount) : (Number(invoice.total_due_amount) || Number(invoice.subtotal) || 2700);
                const rzpRes = await createRazorpayPaymentLink({
                    keyId: config?.razorpay_key_id,
                    keySecret: config?.razorpay_key_secret,
                    amount: payableAmt,
                    customerName: invoice.customer_name,
                    customerPhone: invoice.customer_phone,
                    customerEmail: invoice.customer_email,
                    invoiceNo: invoice.invoice_no,
                    packageName: invoice.package_name || (invoice.items && invoice.items[0]?.description) || 'Sundarban Safari',
                    travelDate: invoice.departure_date_text
                });
                paymentUrl = rzpRes.payment_url;
                connection.query(
                    `UPDATE crm_invoices SET razorpay_payment_url = ?, razorpay_payment_link_id = ? WHERE id = ?`,
                    [paymentUrl, rzpRes.payment_link_id, invoice.id]
                );
            }

            let messageText = custom_message;
            if (!messageText || !messageText.trim()) {
                let templateRecord = null;
                if (template_id) {
                    templateRecord = await getWhatsAppTemplateByIdModel(template_id);
                }
                if (!templateRecord) {
                    const templates = await getWhatsAppTemplatesModel({ category: 'invoice' });
                    templateRecord = templates.find(t => t.is_default === 1) || templates[0];
                }
                const templateRaw = templateRecord ? templateRecord.template_text : `Hello {{customer_name}}, your booking invoice is {{invoice_no}}. Pay here: {{payment_link}}`;

                messageText = renderWhatsAppTemplate(templateRaw, {
                    ...invoice,
                    package_name: invoice.package_name || (invoice.items && invoice.items[0]?.description) || 'Sundarban Safari Package',
                    payment_url: paymentUrl,
                    company_name: config?.company_name || 'DELTA SAFARI',
                    tagline: config?.tagline || 'WHERE EXPECTATIONS MEET REALITY',
                    website: config?.website || 'sundarbandeltasafari.com',
                    mobile_numbers: config?.mobile_numbers || '+91 7029533240'
                });
            }

            const cleanPhone = normalizePhoneNumber(invoice.customer_phone);
            const sendRes = await sendWhatsAppCloudMessage(cleanPhone, messageText.trim());

            // Save in chat history
            const contactRecord = await upsertWhatsAppContact(cleanPhone, invoice.customer_name);
            if (contactRecord?.id) {
                await saveWhatsAppOutgoingMessage({
                    contactId: contactRecord.id,
                    messageId: sendRes?.messageId || null,
                    messageText: messageText.trim()
                });
            }

            connection.query(
                `UPDATE crm_invoices SET whatsapp_message_sent = 1, whatsapp_sent_at = NOW() WHERE id = ?`,
                [invoice.id]
            );

            resolve({
                success: true,
                cloud_api_sent: sendRes?.success || false,
                payment_url: paymentUrl,
                message_text: messageText.trim(),
                phone: cleanPhone,
                api_response: sendRes
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate / Regenerate Invoice Payment Link on-demand
 */
function generateInvoicePaymentLinkModel(invoiceId, customAmount = null) {
    return new Promise(async (resolve, reject) => {
        try {
            const invoice = await getInvoiceDetailsModel(invoiceId);
            if (!invoice) return reject(new Error('Invoice not found.'));

            const config = await getInvoiceConfigModel();
            const payableAmt = customAmount ? Number(customAmount) : (Number(invoice.total_due_amount) || Number(invoice.subtotal) || 2700);

            const rzpRes = await createRazorpayPaymentLink({
                keyId: config?.razorpay_key_id,
                keySecret: config?.razorpay_key_secret,
                amount: payableAmt,
                customerName: invoice.customer_name,
                customerPhone: invoice.customer_phone,
                customerEmail: invoice.customer_email,
                invoiceNo: invoice.invoice_no,
                packageName: invoice.package_name || (invoice.items && invoice.items[0]?.description) || 'Sundarban Safari',
                travelDate: invoice.departure_date_text
            });

            connection.query(
                `UPDATE crm_invoices SET razorpay_payment_url = ?, razorpay_payment_link_id = ? WHERE id = ?`,
                [rzpRes.payment_url, rzpRes.payment_link_id, invoice.id]
            );

            resolve({
                success: true,
                payment_url: rzpRes.payment_url,
                payment_link_id: rzpRes.payment_link_id,
                amount: payableAmt
            });
        } catch (error) {
            reject(error);
        }
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

        if (payment_status && ['pending', 'unpaid', 'partial', 'paid'].includes(payment_status)) {
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
                OR i.pickup_drop LIKE ?
                OR i.departure_date_text LIKE ?
                OR i.package_name LIKE ?
            )`);
            params.push(term, term, term, term, term, term);
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
                    i.package_name,
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
                    i.payment_method,
                    i.payment_note,
                    i.payment_proof_file,
                    i.payment_verified_by,
                    i.payment_verified_at,
                    CONCAT(v.first_name, ' ', COALESCE(v.last_name, '')) AS verified_by_name,
                    i.razorpay_payment_link_id,
                    i.razorpay_payment_url,
                    i.whatsapp_message_sent,
                    i.whatsapp_sent_at,
                    i.bank_details_text,
                    i.terms_text,
                    i.created_by,
                    i.created_at,
                    CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name
                FROM crm_invoices i
                LEFT JOIN user_master u ON u.id = i.created_by
                LEFT JOIN user_master v ON v.id = i.payment_verified_by
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
                u.email AS created_by_email,
                CONCAT(v.first_name, ' ', COALESCE(v.last_name, '')) AS verified_by_name
            FROM crm_invoices i
            LEFT JOIN user_master u ON u.id = i.created_by
            LEFT JOIN user_master v ON v.id = i.payment_verified_by
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

            resolve({
                ...row,
                items: parsedItems
            });
        });
    });
}

/**
 * Delete Invoice
 */
function deleteInvoiceModel(id) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error("Invoice ID is required."));
        connection.query(`DELETE FROM crm_invoices WHERE id = ?`, [id], (err) => {
            if (err) return reject(err);
            resolve({ success: true, id });
        });
    });
}

/**
 * Get Billing Stats
 */
function getBillingStatsModel() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COUNT(id) AS total_invoices,
                COALESCE(SUM(subtotal + gst_amount - discount_amount), 0) AS total_billed_amount,
                COALESCE(SUM(advance_received), 0) AS total_collected_amount,
                COALESCE(SUM(total_due_amount), 0) AS total_due_amount,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) AS pending_invoices,
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
                pending_invoices: 0,
                paid_invoices: 0,
                partial_invoices: 0,
                unpaid_invoices: 0
            });
        });
    });
}

/**
 * Manually update invoice payment status with medium, proof file, and note
 */
function updateInvoicePaymentStatusModel(invoiceId, {
    payment_status,
    payment_method,
    payment_note = '',
    proof_file = null,
    amount_paid = null,
    user_id = null
}) {
    return new Promise(async (resolve, reject) => {
        try {
            const invoice = await getInvoiceDetailsModel(invoiceId);
            if (!invoice) {
                return reject(new Error('Invoice not found.'));
            }

            const validStatuses = ['pending', 'unpaid', 'partial', 'paid'];
            const targetStatus = validStatuses.includes(payment_status) ? payment_status : 'paid';

            let newAdvance = parseFloat(invoice.advance_received) || 0;
            let newDue = parseFloat(invoice.total_due_amount) || 0;
            const totalBillable = (parseFloat(invoice.subtotal) || 0) + (parseFloat(invoice.gst_amount) || 0) - (parseFloat(invoice.discount_amount) || 0);

            let recordedAmount = 0;
            if (targetStatus === 'paid') {
                recordedAmount = newDue > 0 ? newDue : (parseFloat(amount_paid) || totalBillable);
                newAdvance = totalBillable;
                newDue = 0;
            } else if (targetStatus === 'partial') {
                if (amount_paid !== null && !isNaN(parseFloat(amount_paid))) {
                    recordedAmount = Math.max(0, parseFloat(amount_paid));
                    newAdvance = newAdvance + recordedAmount;
                    newDue = Math.max(0, totalBillable - newAdvance);
                }
            } else if (targetStatus === 'unpaid') {
                newDue = totalBillable;
                newAdvance = 0;
            }

            const updateSql = `
                UPDATE crm_invoices 
                SET payment_status = ?,
                    payment_method = ?,
                    payment_note = ?,
                    payment_proof_file = COALESCE(?, payment_proof_file),
                    payment_verified_by = ?,
                    payment_verified_at = NOW(),
                    advance_received = ?,
                    total_due_amount = ?,
                    updated_at = NOW()
                WHERE id = ?
            `;

            connection.query(updateSql, [
                targetStatus,
                payment_method || invoice.payment_method || 'Manual',
                payment_note || '',
                proof_file || null,
                user_id || null,
                newAdvance,
                newDue,
                invoice.id
            ], async (err, result) => {
                if (err) return reject(err);

                // Insert into crm_invoice_payments audit log
                connection.query(`
                    INSERT INTO crm_invoice_payments 
                    (invoice_id, payment_status, payment_method, amount, payment_note, proof_file, recorded_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    invoice.id,
                    targetStatus,
                    payment_method || 'Manual',
                    recordedAmount,
                    payment_note || '',
                    proof_file || null,
                    user_id || null
                ]);

                // Update connected lead if converted
                if (invoice.contact_id && (targetStatus === 'paid' || targetStatus === 'partial')) {
                    const methodStr = payment_method ? ` via ${payment_method}` : '';
                    const noteAppend = `\n[Manual Payment Verified: Status ${targetStatus.toUpperCase()}${methodStr}, Amount: ₹${recordedAmount || newAdvance} on ${new Date().toLocaleDateString('en-IN')}${payment_note ? ` - Note: ${payment_note}` : ''}]`;
                    connection.query(
                        `UPDATE crm_lead_followups 
                         SET is_converted = 1, 
                             converted_at = COALESCE(converted_at, NOW()), 
                             converted_amount = COALESCE(NULLIF(converted_amount, ''), ?),
                             conversion_note = CONCAT(COALESCE(conversion_note, ''), ?),
                             updated_at = NOW() 
                         WHERE contact_id = ?`,
                        [newAdvance, noteAppend, invoice.contact_id],
                        (fErr) => {
                            if (fErr) console.warn('[Manual Payment] Followup update notice:', fErr.message);
                        }
                    );
                }

                resolve({
                    success: true,
                    invoice_id: invoice.id,
                    invoice_no: invoice.invoice_no,
                    payment_status: targetStatus,
                    payment_method: payment_method || 'Manual',
                    advance_received: newAdvance,
                    total_due_amount: newDue
                });
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Get Payment History Logs for an Invoice
 */
function getInvoicePaymentsHistoryModel(invoiceId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                p.*,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS recorded_by_name
            FROM crm_invoice_payments p
            LEFT JOIN user_master u ON u.id = p.recorded_by
            WHERE p.invoice_id = ?
            ORDER BY p.id DESC
        `;
        connection.query(sql, [Number(invoiceId)], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

module.exports = {
    initInvoiceTables,
    getInvoiceConfigModel,
    updateInvoiceConfigModel,
    getWhatsAppTemplatesModel,
    getWhatsAppTemplateByIdModel,
    createWhatsAppTemplateModel,
    updateWhatsAppTemplateModel,
    deleteWhatsAppTemplateModel,
    getNextInvoiceNumberModel,
    createInvoiceModel,
    getInvoicesListModel,
    getInvoiceDetailsModel,
    deleteInvoiceModel,
    getBillingStatsModel,
    sendInvoiceWhatsAppModel,
    generateInvoicePaymentLinkModel,
    renderWhatsAppTemplate,
    autoSettleInvoiceFromRazorpay,
    updateInvoicePaymentStatusModel,
    getInvoicePaymentsHistoryModel
};
