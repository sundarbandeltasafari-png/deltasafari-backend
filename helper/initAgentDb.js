const conn = require('../Connection');

async function init() {
  const queries = [
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INT NULL',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_type INT DEFAULT 1',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travelers LONGTEXT NULL',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS commission_status TINYINT DEFAULT 0',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TINYINT DEFAULT 0',
    'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255) NULL',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS account_number VARCHAR(255) NULL',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50) NULL',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS account_holder VARCHAR(255) NULL',
    'ALTER TABLE user_master ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255) NULL',
    `CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      booking_id INT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type ENUM('CREDIT', 'DEBIT') NOT NULL,
      source VARCHAR(50) DEFAULT 'COMMISSION',
      description TEXT NULL,
      status VARCHAR(20) DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      account_holder VARCHAR(255) NULL,
      bank_name VARCHAR(255) NULL,
      account_number VARCHAR(255) NULL,
      ifsc_code VARCHAR(50) NULL,
      upi_id VARCHAR(255) NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
      admin_remarks TEXT NULL,
      transaction_ref VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  for (const q of queries) {
    await new Promise((resolve) => {
      conn.query(q, (err, res) => {
        if (err) {
          console.log('Query err/note:', err.message);
        } else {
          console.log('Success:', q.slice(0, 45));
        }
        resolve();
      });
    });
  }

  console.log('Agent and Wallet database tables initialized successfully!');
  process.exit(0);
}

init().catch(console.error);
