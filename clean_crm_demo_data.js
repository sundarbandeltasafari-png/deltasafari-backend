/**
 * Clean CRM Demo Data Script
 * 
 * Cleans all demo CRM data:
 * - Leads & follow-ups (crm_lead_followups, crm_lead_followup_logs)
 * - Invoices & payments (crm_invoices, crm_invoice_payments)
 * - WhatsApp contacts & messages (whatsapp_contacts, whatsapp_messages, campaigns)
 * - Tasks & activity logs (crm_tasks, crm_task_activities, crm_task_reads)
 * - Notices (crm_notices, crm_notice_reads)
 * - Peak dates & calendar entries (crm_peak_dates)
 * - Enquiries & demo bookings (corporate_lead_enquiries, holiday_enquiries, bookings, wallet_transactions)
 * - Chat messages & attachments (crm_chat_messages, uploads/chat)
 * - Resets lead distribution counters and invoice sequential numbering
 * - Preserves business configuration, package master, hotels, site settings, and users
 */

const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
    host: process.env.DBHOST || 'localhost',
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASS || '',
    database: process.env.DB || 'deltasafari'
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

async function cleanCrmDemoData() {
    console.log('====================================================');
    console.log('      DELTA SAFARI CRM DEMO DATA CLEANING           ');
    console.log('====================================================\n');

    try {
        await new Promise((res, rej) => connection.connect(err => err ? rej(err) : res()));
        console.log(' Connected to database: ' + (process.env.DB || 'deltasafari'));

        // 1. Table list to clean
        const tablesToClean = [
            'crm_lead_followups',
            'crm_lead_followup_logs',
            'crm_invoices',
            'crm_invoice_payments',
            'whatsapp_contacts',
            'whatsapp_messages',
            'whatsapp_campaigns',
            'whatsapp_campaign_recipients',
            'crm_tasks',
            'crm_task_activities',
            'crm_task_reads',
            'crm_notices',
            'crm_notice_reads',
            'crm_peak_dates',
            'crm_chat_messages',
            'crm_chat_participants',
            'crm_chat_conversations',
            'corporate_lead_enquiries',
            'holiday_enquiries',
            'bookings',
            'wallet_transactions'
        ];

        // 2. Pre-clean row count check
        console.log('\n--- Current Records Before Cleanup ---');
        for (const tbl of tablesToClean) {
            try {
                const res = await query(`SELECT COUNT(*) as count FROM ${tbl}`);
                console.log(`  • ${tbl}: ${res[0].count} records`);
            } catch (err) {
                console.log(`  • ${tbl}: [Table does not exist or error: ${err.message}]`);
            }
        }

        // 3. Disable foreign key checks for clean truncation
        await query('SET FOREIGN_KEY_CHECKS = 0');

        // 4. Truncate each demo table
        console.log('\n--- Truncating Demo Tables & Resetting IDs ---');
        for (const tbl of tablesToClean) {
            try {
                await query(`TRUNCATE TABLE ${tbl}`);
                console.log(`  ✔ Cleaned: ${tbl}`);
            } catch (err) {
                console.warn(`  ⚠ Warning cleaning ${tbl}: ${err.message}`);
                try {
                    await query(`DELETE FROM ${tbl}`);
                    await query(`ALTER TABLE ${tbl} AUTO_INCREMENT = 1`);
                    console.log(`  ✔ Deleted & reset auto-increment: ${tbl}`);
                } catch (delErr) {
                    console.error(`  ✖ Failed to clean ${tbl}: ${delErr.message}`);
                }
            }
        }

        // 5. Reset Lead Distribution Settings counters
        try {
            await query(`UPDATE crm_lead_distribution_settings SET leads_count = 0, last_assigned_at = NULL`);
            console.log('\n  ✔ Reset crm_lead_distribution_settings: leads_count = 0, last_assigned_at = NULL');
        } catch (err) {
            console.warn('  ⚠ Notice updating lead distribution settings:', err.message);
        }

        // 6. Reset Next Invoice Number in crm_invoice_config
        try {
            await query(`UPDATE crm_invoice_config SET next_invoice_number = 30001`);
            console.log('  ✔ Reset crm_invoice_config: next_invoice_number = 30001');
        } catch (err) {
            console.warn('  ⚠ Notice updating invoice config:', err.message);
        }

        // 7. Recreate default Team Hub channel for team chat
        try {
            const adminUsers = await query(`SELECT id FROM user_master WHERE admin IN (1, 2) ORDER BY id ASC`);
            const firstAdminId = adminUsers.length > 0 ? adminUsers[0].id : 1;

            const hubResult = await query(`
                INSERT INTO crm_chat_conversations (type, title, created_by, last_message, last_message_at)
                VALUES ('group', 'Delta Safari Team Hub', ?, 'Welcome to Delta Safari Team Hub!', NOW())
            `, [firstAdminId]);

            const newHubId = hubResult.insertId;

            // Add welcome message
            await query(`
                INSERT INTO crm_chat_messages (conversation_id, sender_id, message_type, message)
                VALUES (?, ?, 'system', 'Welcome to Delta Safari Team Hub! Real-time internal collaboration channel.')
            `, [newHubId, firstAdminId]);

            // Add all admin users as participants
            for (const admin of adminUsers) {
                await query(`
                    INSERT IGNORE INTO crm_chat_participants (conversation_id, user_id, joined_at, last_read_at)
                    VALUES (?, ?, NOW(), NOW())
                `, [newHubId, admin.id]);
            }
            console.log('  ✔ Reinitialized clean default "Delta Safari Team Hub" chat channel');
        } catch (err) {
            console.warn('  ⚠ Notice reinitializing Team Hub:', err.message);
        }

        // 8. Re-enable foreign key checks
        await query('SET FOREIGN_KEY_CHECKS = 1');

        // 9. Clean up demo uploads (chat attachments)
        const chatUploadsDir = path.join(__dirname, 'uploads', 'chat');
        if (fs.existsSync(chatUploadsDir)) {
            const files = fs.readdirSync(chatUploadsDir);
            let deletedCount = 0;
            for (const file of files) {
                if (file !== '.gitkeep') {
                    try {
                        fs.unlinkSync(path.join(chatUploadsDir, file));
                        deletedCount++;
                    } catch (fErr) {}
                }
            }
            console.log(`\n  ✔ Cleaned ${deletedCount} demo chat attachment files from uploads/chat/`);
        }

        // 10. Post-clean verification
        console.log('\n--- Post-Clean Verification ---');
        for (const tbl of tablesToClean) {
            try {
                const res = await query(`SELECT COUNT(*) as count FROM ${tbl}`);
                console.log(`  • ${tbl}: ${res[0].count} records`);
            } catch (err) {
                console.log(`  • ${tbl}: [Error: ${err.message}]`);
            }
        }

        console.log('\n====================================================');
        console.log('   CRM DEMO DATA CLEANUP COMPLETED SUCCESSFULLY!    ');
        console.log('====================================================\n');

    } catch (err) {
        console.error('\n✖ Cleanup failed:', err);
    } finally {
        connection.end();
    }
}

cleanCrmDemoData();
