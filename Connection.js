const dotenv = require('dotenv');
dotenv.config();
var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DBHOST || 'localhost',
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASS || '',
    database: process.env.DB || 'deltasafari'
});

// var connection = mysql.createPool({
//     connectionLimit: 10,
//     host: '127.0.0.1',
//     user: 'u662254688_deltasafari',
//     password: 'Admin1q2w--!',
//     database: 'u662254688_deltasafari'
// });


// Auto Migration for Referral Program & Tables
const runMigrations = () => {
    connection.query(`SHOW COLUMNS FROM user_master LIKE 'referral_code'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE user_master ADD COLUMN referral_code VARCHAR(50) UNIQUE DEFAULT NULL`, (e) => {
                if (e) console.error("Error adding referral_code to user_master:", e.message);
            });
        }
    });

    connection.query(`SHOW COLUMNS FROM user_master LIKE 'referred_by_id'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE user_master ADD COLUMN referred_by_id INT NULL DEFAULT NULL`, (e) => {
                if (e) console.error("Error adding referred_by_id to user_master:", e.message);
            });
        }
    });

    connection.query(`SHOW COLUMNS FROM packages_master LIKE 'user_commission'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE packages_master ADD COLUMN user_commission DECIMAL(10,2) DEFAULT 500.00`, (e) => {
                if (e) console.error("Error adding user_commission to packages_master:", e.message);
            });
        }
    });

    const createReferralsTable = `
        CREATE TABLE IF NOT EXISTS referral_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            referrer_id INT NOT NULL,
            referred_user_id INT NOT NULL,
            booking_id INT NOT NULL,
            package_id INT NOT NULL,
            commission_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(30) DEFAULT 'CREDITED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX(referrer_id),
            INDEX(referred_user_id),
            INDEX(booking_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    connection.query(createReferralsTable, (err) => {
        if (err) console.error("Error creating referral_transactions table:", err.message);
    });

    const createWalletTransTable = `
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            booking_id INT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type VARCHAR(20) NOT NULL,
            source VARCHAR(30) DEFAULT 'REFERRAL',
            description TEXT,
            status VARCHAR(20) DEFAULT 'CREDITED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX(user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    connection.query(createWalletTransTable, (err) => {
        if (err) console.error("Error creating wallet_transactions table:", err.message);
    });

    const createHolidayEnquiriesTable = `
        CREATE TABLE IF NOT EXISTS holiday_enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            destination VARCHAR(255) NULL,
            departure_city VARCHAR(100) NULL,
            travel_date VARCHAR(100) NULL,
            duration_days INT DEFAULT 1,
            duration_nights INT DEFAULT 0,
            adults_count INT DEFAULT 1,
            children_count INT DEFAULT 0,
            infants_count INT DEFAULT 0,
            hotel_category VARCHAR(100) NULL,
            meal_plan VARCHAR(100) NULL,
            cab_type VARCHAR(100) NULL,
            include_flights INT DEFAULT 0,
            budget VARCHAR(100) NULL,
            message TEXT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    connection.query(createHolidayEnquiriesTable, (err) => {
        if (err) console.error("Error creating holiday_enquiries table:", err.message);

        // Safe Column Migration for existing tables
        const cols = [
            { name: 'full_name', type: 'VARCHAR(255) NULL' },
            { name: 'name', type: 'VARCHAR(255) NULL' },
            { name: 'email', type: 'VARCHAR(255) NULL' },
            { name: 'phone', type: 'VARCHAR(50) NULL' },
            { name: 'destination', type: 'VARCHAR(255) NULL' },
            { name: 'departure_city', type: 'VARCHAR(100) NULL' },
            { name: 'travel_date', type: 'VARCHAR(100) NULL' },
            { name: 'duration_days', type: 'INT DEFAULT 1' },
            { name: 'duration_nights', type: 'INT DEFAULT 0' },
            { name: 'adults_count', type: 'INT DEFAULT 1' },
            { name: 'adults', type: 'VARCHAR(50) NULL' },
            { name: 'children_count', type: 'INT DEFAULT 0' },
            { name: 'children', type: 'VARCHAR(50) NULL' },
            { name: 'infants_count', type: 'INT DEFAULT 0' },
            { name: 'hotel_category', type: 'VARCHAR(100) NULL' },
            { name: 'meal_plan', type: 'VARCHAR(100) NULL' },
            { name: 'cab_type', type: 'VARCHAR(100) NULL' },
            { name: 'include_flights', type: 'INT DEFAULT 0' },
            { name: 'budget', type: 'VARCHAR(100) NULL' },
            { name: 'message', type: 'TEXT NULL' },
            { name: 'status', type: 'VARCHAR(50) DEFAULT "Pending"' }
        ];

        cols.forEach((col) => {
            connection.query(`SHOW COLUMNS FROM holiday_enquiries LIKE '${col.name}'`, (cErr, rows) => {
                if (!cErr && rows && rows.length === 0) {
                    connection.query(`ALTER TABLE holiday_enquiries ADD COLUMN ${col.name} ${col.type}`, (aErr) => {
                        if (aErr) console.error(`Error adding column ${col.name}:`, aErr.message);
                    });
                }
            });
        });

        connection.query(`SHOW COLUMNS FROM holiday_enquiries LIKE 'user_id'`, (cErr, rows) => {
            if (!cErr && rows && rows.length === 0) {
                connection.query(`ALTER TABLE holiday_enquiries ADD COLUMN user_id INT DEFAULT NULL`, (aErr) => {
                    if (aErr) console.error(`Error adding user_id to holiday_enquiries:`, aErr.message);
                });
            }
        });
    });

    const createCorporateLeadTable = `
        CREATE TABLE IF NOT EXISTS corporate_lead_enquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            booking_reference VARCHAR(50) NULL,
            company_name VARCHAR(255) NULL,
            full_name VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            city VARCHAR(100) NULL,
            trip_type VARCHAR(100) NULL,
            destination VARCHAR(255) NULL,
            departure_city VARCHAR(100) NULL,
            departure_date VARCHAR(100) NULL,
            travel_window VARCHAR(100) NULL,
            duration_days INT DEFAULT 1,
            duration_nights INT DEFAULT 0,
            adults_count INT DEFAULT 1,
            male_count INT DEFAULT 0,
            female_count INT DEFAULT 0,
            total_employees INT DEFAULT 1,
            children_count INT DEFAULT 0,
            infants_count INT DEFAULT 0,
            hotel_category VARCHAR(100) NULL,
            room_sharing VARCHAR(100) NULL,
            meal_plan VARCHAR(100) NULL,
            cab_type VARCHAR(100) NULL,
            include_flights INT DEFAULT 0,
            include_train INT DEFAULT 0,
            budget_band VARCHAR(100) NULL,
            special_notes TEXT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    const createBookingsTable = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL DEFAULT NULL,
            package_id INT NULL DEFAULT NULL,
            customer_name VARCHAR(255) NULL,
            customer_email VARCHAR(255) NULL,
            customer_phone VARCHAR(50) NULL,
            customer_comment TEXT NULL,
            total_travelers INT DEFAULT 1,
            travelers LONGTEXT NULL,
            departure_date VARCHAR(100) NULL,
            actual_price DECIMAL(10,2) DEFAULT 0.00,
            total_cost DECIMAL(10,2) DEFAULT 0.00,
            booking_type VARCHAR(50) DEFAULT 'DIRECT_RAZORPAY',
            payment_method VARCHAR(50) DEFAULT 'RAZORPAY',
            payment_status VARCHAR(50) DEFAULT 'PENDING',
            razorpay_order_id VARCHAR(100) NULL,
            razorpay_payment_id VARCHAR(100) NULL,
            razorpay_signature VARCHAR(255) NULL,
            booking_status INT DEFAULT 1,
            invoice_number VARCHAR(100) NULL,
            commission_amount DECIMAL(10,2) DEFAULT 0.00,
            commission_status INT DEFAULT 0,
            email_sent_to_user INT DEFAULT 0,
            email_sent_to_admin INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(user_id),
            INDEX(package_id),
            INDEX(razorpay_order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    connection.query(createBookingsTable, (err) => {
        if (err) console.error("Error creating bookings table:", err.message);

        const bookingCols = [
            { name: 'user_id', type: 'INT NULL DEFAULT NULL' },
            { name: 'package_id', type: 'INT NULL DEFAULT NULL' },
            { name: 'customer_name', type: 'VARCHAR(255) NULL' },
            { name: 'customer_email', type: 'VARCHAR(255) NULL' },
            { name: 'customer_phone', type: 'VARCHAR(50) NULL' },
            { name: 'customer_comment', type: 'TEXT NULL' },
            { name: 'total_travelers', type: 'INT DEFAULT 1' },
            { name: 'travelers', type: 'LONGTEXT NULL' },
            { name: 'departure_date', type: 'VARCHAR(100) NULL' },
            { name: 'actual_price', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'total_cost', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'booking_type', type: "VARCHAR(50) DEFAULT 'DIRECT_RAZORPAY'" },
            { name: 'payment_method', type: "VARCHAR(50) DEFAULT 'RAZORPAY'" },
            { name: 'payment_status', type: "VARCHAR(50) DEFAULT 'PENDING'" },
            { name: 'razorpay_order_id', type: 'VARCHAR(100) NULL' },
            { name: 'razorpay_payment_id', type: 'VARCHAR(100) NULL' },
            { name: 'razorpay_signature', type: 'VARCHAR(255) NULL' },
            { name: 'booking_status', type: 'INT DEFAULT 1' },
            { name: 'invoice_number', type: 'VARCHAR(100) NULL' },
            { name: 'commission_amount', type: 'DECIMAL(10,2) DEFAULT 0.00' },
            { name: 'commission_status', type: 'INT DEFAULT 0' },
            { name: 'email_sent_to_user', type: 'INT DEFAULT 0' },
            { name: 'email_sent_to_admin', type: 'INT DEFAULT 0' }
        ];

        bookingCols.forEach((col) => {
            connection.query(`SHOW COLUMNS FROM bookings LIKE '${col.name}'`, (cErr, rows) => {
                if (!cErr && rows && rows.length === 0) {
                    connection.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`, (aErr) => {
                        if (aErr) console.error(`Error adding column ${col.name} to bookings:`, aErr.message);
                    });
                }
            });
        });
    });
};

connection.on('connection', function (conn) {
    runMigrations();
    conn.on('error', function (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            conn.destroy();
        }
    });
});

module.exports = connection;