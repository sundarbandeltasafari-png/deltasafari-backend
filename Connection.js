const dotenv = require('dotenv');
dotenv.config();
var mysql = require('mysql');

// var connection = mysql.createPool({
//     connectionLimit: 10,
//     host: process.env.DBHOST || 'localhost',
//     user: process.env.DBUSER || 'root',
//     password: process.env.DBPASS || '',
//     database: process.env.DB || 'deltasafari'
// });

var connection = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'u662254688_deltasafari',
    password: 'Admin1q2w--!',
    database: 'u662254688_deltasafari'
});


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

    // Auto Migration for Corporate Destinations in zone & cities
    connection.query(`SHOW COLUMNS FROM zone LIKE 'show_in_corporate'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE zone ADD COLUMN show_in_corporate INT DEFAULT 0`, (e) => {
                if (e) console.error("Error adding show_in_corporate to zone:", e.message);
            });
        }
    });

    connection.query(`SHOW COLUMNS FROM zone LIKE 'corporate_tag'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE zone ADD COLUMN corporate_tag VARCHAR(255) NULL`, (e) => {
                if (e) console.error("Error adding corporate_tag to zone:", e.message);
            });
        }
    });

    connection.query(`SHOW COLUMNS FROM cities LIKE 'show_in_corporate'`, (err, rows) => {
        if (!err && rows && rows.length === 0) {
            connection.query(`ALTER TABLE cities ADD COLUMN show_in_corporate INT DEFAULT 0`, (e) => {
                if (e) console.error("Error adding show_in_corporate to cities:", e.message);
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

    // 1. Hotels Master Table
    const createHotelsTable = `
        CREATE TABLE IF NOT EXISTS hotels_master (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NULL,
            star_rating INT DEFAULT 3,
            hotel_type VARCHAR(100) DEFAULT 'Resort',
            city_id INT NULL,
            city_name VARCHAR(100) NULL,
            zone_id INT NULL,
            zone_name VARCHAR(100) NULL,
            address VARCHAR(255) NULL,
            starting_price DECIMAL(10,2) DEFAULT 0.00,
            main_image VARCHAR(255) NULL,
            images LONGTEXT NULL,
            amenities LONGTEXT NULL,
            room_types LONGTEXT NULL,
            description LONGTEXT NULL,
            check_in_time VARCHAR(50) DEFAULT '12:00 PM',
            check_out_time VARCHAR(50) DEFAULT '11:00 AM',
            contact_number VARCHAR(50) NULL,
            contact_email VARCHAR(100) NULL,
            meta_title VARCHAR(255) NULL,
            meta_description TEXT NULL,
            tags VARCHAR(255) NULL,
            status INT DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(slug),
            INDEX(city_id),
            INDEX(zone_id),
            INDEX(status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    connection.query(createHotelsTable, (err) => {
        if (err) console.error("Error creating hotels_master table:", err.message);

        // 2. Package Reference Hotels Junction Table (Many-to-Many)
        const createPackageHotelsTable = `
            CREATE TABLE IF NOT EXISTS package_reference_hotels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                package_id INT NOT NULL,
                hotel_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX(package_id),
                INDEX(hotel_id),
                UNIQUE KEY uniq_pkg_hotel (package_id, hotel_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        connection.query(createPackageHotelsTable, (pErr) => {
            if (pErr) console.error("Error creating package_reference_hotels table:", pErr.message);

            // Optional Seed initial reference hotels if empty
            connection.query(`SELECT COUNT(*) as count FROM hotels_master`, (sErr, sRows) => {
                if (!sErr && sRows && sRows[0]?.count === 0) {
                    const sampleAmenities1 = JSON.stringify([
                        "Free High-Speed Wi-Fi",
                        "Air Conditioned Cottages",
                        "Multi-Cuisine Restaurant",
                        "24/7 Power Backup",
                        "Safari Boat Jetty Transfer",
                        "River View Balcony",
                        "Campfire & Folk Baul Show",
                        "Tea/Coffee Maker",
                        "Hot Water Geyser"
                    ]);
                    const sampleRoomTypes1 = JSON.stringify([
                        { name: "Deluxe AC Mud Cottage", price: 2800, features: "King Bed, Riverfront Balcony, Attached Washroom, AC" },
                        { name: "Executive Mangrove Suite", price: 4200, features: "Private Deck, Bathtub, Garden View, Complimentary Breakfast" }
                    ]);
                    const sampleAmenities2 = JSON.stringify([
                        "Swimming Pool",
                        "Air Conditioned Luxury Rooms",
                        "River-Facing Dining Deck",
                        "24/7 Room Service",
                        "Spa & Wellness Center",
                        "Complimentary Breakfast",
                        "Free Wi-Fi",
                        "Doctor on Call"
                    ]);
                    const sampleRoomTypes2 = JSON.stringify([
                        { name: "Luxury Riverfront Room", price: 3500, features: "Scenic River View, King Bed, Minibar, Smart TV" },
                        { name: "Royal Forest Villa", price: 5500, features: "Jacuzzi, Private Lawn, Butler Service, 24hr In-Room Dining" }
                    ]);

                    const seedSql = `
                        INSERT INTO hotels_master (name, slug, star_rating, hotel_type, city_name, zone_name, address, starting_price, main_image, amenities, room_types, description, check_in_time, check_out_time, status)
                        VALUES 
                        ('Sundarban Tiger Camp Eco Resort', 'sundarban-tiger-camp-eco-resort', 4, 'Eco Resort', 'Dayapur', 'Sundarban', 'Dayapur Island, Opp. Sajnekhali Watchtower, Sundarban, West Bengal', 2800.00, '/assets/img/innerpages/hotel-dt-gallery-img1.jpg', ?, ?, 'Nestled right in the heart of nature across Sajnekhali Tiger Reserve, Sundarban Tiger Camp Eco Resort offers authentic tribal architecture combined with modern comforts. Enjoy riverside dining, fresh local Bengali fish delicacies, sunset watchtower views, and cultural folk performances every evening.', '12:00 PM', '11:00 AM', 1),
                        ('Pakhiralay Riverside Retreat & Spa', 'pakhiralay-riverside-retreat-and-spa', 4, 'Resort', 'Pakhiralay', 'Sundarban', 'Pakhiralay Main Road, Near Tourist Jetty, Gosaba, Sundarban', 3200.00, '/assets/img/innerpages/hotel-dt-gallery-img2.jpg', ?, ?, 'A premium riverfront resort located just minutes from the main boat boarding point. Features manicured green gardens, an outdoor swimming pool, dedicated children play area, multi-cuisine open-air restaurant, and prompt safari assistance.', '12:00 PM', '10:30 AM', 1);
                    `;
                    connection.query(seedSql, [sampleAmenities1, sampleRoomTypes1, sampleAmenities2, sampleRoomTypes2], (insErr, insRes) => {
                        if (!insErr && insRes?.insertId) {
                            // Link first two hotels to all existing packages
                            connection.query(`SELECT id FROM packages_master`, (pkgErr, packages) => {
                                if (!pkgErr && packages && packages.length > 0) {
                                    packages.forEach((pkg) => {
                                        connection.query(`INSERT IGNORE INTO package_reference_hotels (package_id, hotel_id) VALUES (?, ?), (?, ?)`, [pkg.id, insRes.insertId, pkg.id, insRes.insertId + 1]);
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });
};

let migrationExecuted = false;
const runMigrationsOnce = () => {
    if (migrationExecuted) return;
    migrationExecuted = true;
    runMigrations();
};

connection.on('connection', function (conn) {
    runMigrationsOnce();
    conn.on('error', function (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            conn.destroy();
        }
    });
});

module.exports = connection;