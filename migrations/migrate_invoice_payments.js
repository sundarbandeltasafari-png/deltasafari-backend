const pool = require('../Connection');

async function migrate() {
    console.log('Running migration...');
    
    // 1. Update payment_status enum in crm_invoices
    await new Promise((resolve, reject) => {
        pool.query(
            "ALTER TABLE crm_invoices MODIFY COLUMN payment_status ENUM('pending', 'unpaid', 'partial', 'paid') DEFAULT 'pending'",
            (err) => {
                if (err) {
                    console.error('Error altering payment_status:', err);
                    reject(err);
                } else {
                    console.log('payment_status enum updated to include pending.');
                    resolve();
                }
            }
        );
    });

    // 2. Add payment audit columns
    const cols = [
        { name: 'payment_method', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'payment_note', type: 'TEXT DEFAULT NULL' },
        { name: 'payment_proof_file', type: 'TEXT DEFAULT NULL' },
        { name: 'payment_verified_by', type: 'INT(11) DEFAULT NULL' },
        { name: 'payment_verified_at', type: 'DATETIME DEFAULT NULL' }
    ];

    for (const c of cols) {
        await new Promise((resolve) => {
            pool.query(`ALTER TABLE crm_invoices ADD COLUMN ${c.name} ${c.type}`, (err) => {
                if (err && err.code !== 'ER_DUP_FIELDNAME') {
                    console.warn(`Notice adding ${c.name}:`, err.message);
                } else {
                    console.log(`Column ${c.name} verified.`);
                }
                resolve();
            });
        });
    }

    // 3. Create crm_invoice_payments table
    await new Promise((resolve, reject) => {
        pool.query(`
            CREATE TABLE IF NOT EXISTS crm_invoice_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_id INT NOT NULL,
                payment_status ENUM('pending', 'unpaid', 'partial', 'paid') NOT NULL,
                payment_method VARCHAR(50) DEFAULT NULL,
                amount DECIMAL(10,2) DEFAULT 0.00,
                payment_note TEXT DEFAULT NULL,
                proof_file TEXT DEFAULT NULL,
                recorded_by INT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (invoice_id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating crm_invoice_payments:', err);
                reject(err);
            } else {
                console.log('crm_invoice_payments table created/verified.');
                resolve();
            }
        });
    });

    console.log('Migration completed successfully!');
    process.exit(0);
}

migrate().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});
