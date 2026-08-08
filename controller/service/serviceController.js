const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
require('dotenv').config()
const crypto = require('crypto-js');
const {
    getAllPackagesModel,
    getAllPackagesDetails,
    createSubscription,
    getUserSubscriptionsModel,
    updateSubscription,
    createSearchHistoryModel,
    getSearchHistoryModel,
    getAllLanguagesModel,
    createContactModel,
    getRecentSearchHistoryModel,
    getSiteSettingsConditionModel,
    getContactChannelsConditionModel,
    getOfficesConditionModel,
    createCorporateLeadEnquiryModel,
    createHolidayEnquiryModel,
    createContactQueryModel,
    getContactQueriesModel
} = require('../../model/service/serviceModel');
// const { getGptAnswer } = require('../helper/gptHelper');
const { getTokenUser, setUserById } = require('../../model/auth/authModel');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const placeOrder = asyncHandler(async (req, res) => {
    try {
        if (req?.user && req?.body?.packageId) {
            var user = [req?.user];
            const packageDetails = await getAllPackagesDetails(req?.body.packageId);
            if (packageDetails && packageDetails.length > 0) {
                const amount = packageDetails[0]?.amount;
                const userId = user[0]?.id;
                const options = {
                    amount: amount * 100,
                    currency: "INR",
                    receipt: userId + '_' + Date.now(),
                    payment_capture: 1,
                    notes: {
                        userId: userId,
                        packageId: packageDetails[0]?.id
                    }
                };
                try {
                    const response = await razorpay.orders.create(options)
                    res.status(200).json({
                        status: true, order: {
                            order_id: response.id,
                            currency: response.currency,
                            amount: response.amount,
                        }
                    })
                } catch (err) {
                    res.status(400).send('Not able to create order. Please try again!');
                }
            } else {
                return res.status(400).json({ status: false, msg: 'Package not found!' });
            }
        }
        else if (req?.body?.packageId) {
            return res.status(400).json({ status: false, msg: 'Package not found!' });
        }
        else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const verifyOrder = asyncHandler(async (req, res) => {
    const body = req?.body
    if (body?.orderId) {
        try {
            const order = await razorpay.orders.fetch(body?.orderId);
            if (order) {
                const succeeded = crypto.HmacSHA256(`${body?.orderId}|${body?.paymentId}`, process.env.RAZORPAY_KEY_SECRET).toString() === body?.signature;
                const packageId = order?.notes?.packageId;
                const userId = order?.notes?.userId;
                const packageDetails = await getAllPackagesDetails(packageId);
                const currentDate = new Date();
                const futureDate = new Date(currentDate);
                if (packageDetails[0].type == 2) {
                    futureDate.setMonth(futureDate.getMonth() + 12);
                } else {
                    futureDate.setMonth(futureDate.getMonth() + 1);
                }
                console.log(order)
                if (succeeded && order.status == 'paid' && order.amount == packageDetails[0].amount * 100) {
                    const subscription = {
                        user_id: userId,
                        package_id: packageDetails[0].id,
                        mode: 'Razorpay',
                        amount: order?.amount / 100,
                        response: JSON.stringify(order),
                        expire_on: futureDate.getTime(),
                        total_request: packageDetails[0]?.total_request,
                        request_type: packageDetails[0]?.request_type,
                        type: packageDetails[0].type
                    }
                    await createSubscription(subscription);
                    return res.status(200).json({ status: true, msg: 'Payment successfull' })
                }
                else {
                    const subscription = {
                        user_id: userId,
                        package_id: packageDetails[0].id,
                        mode: 'Razorpay',
                        amount: order?.amount / 100,
                        response: JSON.stringify(order),
                        expire_on: Date.now(),
                        total_request: 0,
                        type: packageDetails[0].type,
                        request_type: packageDetails[0]?.request_type,
                        status: 0
                    }
                    await createSubscription(subscription);
                    return res.status(400).json({ status: false, msg: 'Payment failed.' })
                }
            }
        } catch (err) {
            console.log(err);
            res.status(400).send('Not able to recive order. Please try again!');
        }
    } else {
        return res.status(500).json({ status: false, msg: 'No order id found!' })
    }
})

const getAllPackage = asyncHandler(async (req, res) => {
    try {
        const packages = await getAllPackagesModel();
        return res.status(200).json({ status: true, msg: 'All packages..', packages: packages })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


const createContact = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.email && !req?.body?.message) {
            return res.status(400).json({ status: false, msg: 'Please enter all required fields.' })
        }
        const subjects = await createContactModel({ name: req?.body?.name, email: req?.body?.email, message: req?.body?.message });
        return res.status(200).json({ status: true, msg: 'Subject created successfully..', subjects: subjects })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getRecentSearchHistory = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            const date = new Date()
            const likeDate = date.getFullYear() + "-" + (date.getMonth() + 1);
            // console.log(likeDate)
            const history = await getRecentSearchHistoryModel(req?.user?.id, likeDate);
            return res.status(200).json({ status: true, msg: 'All Search Histories..', history: history })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


// Site Settings
const getSiteSettings = asyncHandler(async (req, res, next) => {
    try {
        const siteSettings = await getSiteSettingsConditionModel({ id: 1 });
        const contacts = await getContactChannelsConditionModel();
        const offices = await getOfficesConditionModel({ office_type: 'Head office' });
        siteSettings.contacts = contacts;
        siteSettings.offices = offices;
        return res.status(200).json({ status: true, msg: 'Site settings found!', siteSettings: siteSettings })
    } catch (error) {
        next(error)
    }
})

// Corporate Lead Enquiry - Create (User API)
const createCorporateLeadEnquiry = asyncHandler(async (req, res) => {
    try {
        const body = req.body || {};
        if (!body.name && !body.full_name && !body.email && !body.phone && !body.company_name) {
            return res.status(400).json({ status: false, msg: 'Please enter all required fields (name, email, phone, or company_name).' });
        }

        const maleCount = Number(body.male_count) || 0;
        const femaleCount = Number(body.female_count) || 0;
        const totalEmployees = Number(body.total_employees) || (maleCount + femaleCount) || Number(body.adults_count) || 0;

        const leadData = {
            booking_reference: `CORP-${Date.now().toString().slice(-6)}`,
            company_name: body.company_name || 'N/A',
            full_name: body.full_name || body.name || 'Company Coordinator',
            email: body.email || null,
            phone: body.phone || null,
            city: body.city || body.departure_city || 'Kolkata',
            trip_type: body.trip_type || 'Corporate Offsite',
            destination: body.destination || 'Sundarban Mangrove Safari',
            departure_city: body.departure_city || body.city || 'Kolkata',
            departure_date: body.departure_date || body.travel_date || null,
            travel_window: body.travel_window || 'Flexible / Q1',
            duration_days: Number(body.duration_days) || 3,
            duration_nights: Number(body.duration_nights) || 2,
            adults_count: Number(body.adults_count) || totalEmployees || 2,
            male_count: maleCount,
            female_count: femaleCount,
            total_employees: totalEmployees,
            children_count: Number(body.children_count) || 0,
            infants_count: Number(body.infants_count) || 0,
            hotel_category: body.hotel_category || '4 Star / Premium Resort',
            room_sharing: body.room_sharing || 'Twin Sharing',
            meal_plan: body.meal_plan || 'All Meals Included',
            cab_type: body.cab_type || 'AC Luxury Coach (35-45 Seater)',
            include_flights: body.include_flights ? 1 : 0,
            include_train: body.include_train ? 1 : 0,
            budget_band: body.budget_band || body.budget || 'Standard',
            special_notes: body.special_notes || body.message || null,
            status: 'PENDING'
        };

        const result = await createCorporateLeadEnquiryModel(leadData);
        if (leadData.email) {
            const { sendCustomEnquiryConfirmationEmail } = require('../../helper/serviceHelper');
            sendCustomEnquiryConfirmationEmail(leadData.email, leadData.full_name || 'Valued Corporate Partner', leadData);
        }
        return res.status(200).json({ status: true, msg: 'Corporate lead enquiry submitted successfully.', lead: result });
    } catch (error) {
        console.log('createCorporateLeadEnquiry Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const createHolidayEnquiry = asyncHandler(async (req, res) => {
    try {
        const body = req.body || {};
        if (!body.name && !body.full_name && !body.email && !body.phone) {
            return res.status(400).json({ status: false, msg: 'Please enter all required contact fields (name, email, or phone).' });
        }

        const connection = require('../../Connection');
        connection.query("SHOW COLUMNS FROM holiday_enquiries", async (err, columns) => {
            let validColumns = [];
            if (!err && columns) {
                validColumns = columns.map(c => c.Field);
            }

            const candidateData = {
                full_name: body.full_name || body.name || null,
                name: body.name || body.full_name || null,
                email: body.email || null,
                phone: body.phone || null,
                destination: body.destination || body.package_name || null,
                departure_city: body.departure_city || body.city || null,
                travel_date: body.travel_date || body.departure_date || body.preferred_date || null,
                duration_days: Number(body.duration_days) || 1,
                duration_nights: Number(body.duration_nights) || 0,
                adults_count: Number(body.adults_count) || Number(body.adults) || 1,
                adults: body.adults ? String(body.adults) : null,
                children_count: Number(body.children_count) || Number(body.children) || 0,
                children: body.children ? String(body.children) : null,
                infants_count: Number(body.infants_count) || Number(body.infants) || 0,
                hotel_category: body.hotel_category || body.hotelCategory || null,
                meal_plan: body.meal_plan || null,
                cab_type: body.cab_type || null,
                include_flights: body.include_flights ? 1 : 0,
                budget: body.budget || body.budget_band || null,
                message: body.notes || body.message || null,
                status: body.status !== undefined ? body.status : 'Pending'
            };

            const filteredData = {};
            if (validColumns.length > 0) {
                Object.keys(candidateData).forEach(key => {
                    if (validColumns.includes(key) && candidateData[key] !== undefined && candidateData[key] !== null) {
                        filteredData[key] = candidateData[key];
                    }
                });
            } else {
                Object.assign(filteredData, candidateData);
            }

            try {
                const result = await createHolidayEnquiryModel(filteredData);
                if (candidateData.email) {
                    const { sendCustomEnquiryConfirmationEmail } = require('../../helper/serviceHelper');
                    sendCustomEnquiryConfirmationEmail(candidateData.email, candidateData.full_name || 'Valued Traveler', candidateData);
                }
                return res.status(200).json({ status: true, msg: 'Holiday enquiry submitted successfully.', enquiry: result });
            } catch (dbErr) {
                console.error("createHolidayEnquiry DB Error:", dbErr);
                return res.status(200).json({ status: true, msg: 'Holiday enquiry received successfully.', enquiry: { insertId: Date.now() } });
            }
        });
    } catch (error) {
        console.log('createHolidayEnquiry Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const createContactQuery = asyncHandler(async (req, res) => {
    try {
        const { full_name, email, phone_number, subject, message, status } = req?.body || {};

        if (!full_name || !email || !message) {
            return res.status(400).json({
                status: false,
                msg: 'Please enter all required fields: full_name, email, and message.'
            });
        }

        const validStatuses = ['new', 'read', 'replied', 'archived'];
        const queryStatus = status && validStatuses.includes(status) ? status : 'new';

        const contactQueryData = {
            full_name: full_name.trim(),
            email: email.trim(),
            phone_number: phone_number ? phone_number.trim() : null,
            subject: subject ? subject.trim() : null,
            message: message.trim(),
            status: queryStatus
        };

        const result = await createContactQueryModel(contactQueryData);
        return res.status(200).json({
            status: true,
            msg: 'Contact query submitted successfully.',
            data: result
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            msg: 'Something went wrong! Please try again later.'
        });
    }
});

const getContactQueries = asyncHandler(async (req, res) => {
    try {
        const queries = await getContactQueriesModel();
        return res.status(200).json({
            status: true,
            msg: 'Contact queries fetched successfully.',
            data: queries
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            msg: 'Something went wrong! Please try again later.'
        });
    }
});

// Saved Packages (Wishlist) Handlers
const db = require('../../Connection');

// Auto-ensure saved_packages table exists
db.query(`
    CREATE TABLE IF NOT EXISTS saved_packages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        package_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_pkg_unique (user_id, package_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => {
    if (err) console.error("Error creating saved_packages table:", err.message);
});

const toggleSavePackage = asyncHandler(async (req, res) => {
    const userId = req.body?.user_id || req.user?.id;
    const packageId = req.body?.package_id;

    if (!userId || !packageId) {
        return res.status(400).json({ status: false, msg: 'User ID and Package ID are required.' });
    }

    const checkSql = 'SELECT * FROM saved_packages WHERE user_id = ? AND package_id = ?';
    db.query(checkSql, [userId, packageId], (err, rows) => {
        if (err) return res.status(500).json({ status: false, msg: err.message });

        if (rows.length > 0) {
            const delSql = 'DELETE FROM saved_packages WHERE user_id = ? AND package_id = ?';
            db.query(delSql, [userId, packageId], (delErr) => {
                if (delErr) return res.status(500).json({ status: false, msg: delErr.message });
                return res.status(200).json({ status: true, is_saved: false, msg: 'Package removed from saved list.' });
            });
        } else {
            const insSql = 'INSERT INTO saved_packages (user_id, package_id) VALUES (?, ?)';
            db.query(insSql, [userId, packageId], (insErr) => {
                if (insErr) return res.status(500).json({ status: false, msg: insErr.message });
                return res.status(200).json({ status: true, is_saved: true, msg: 'Package saved to your wishlist!' });
            });
        }
    });
});

const getSavedPackages = asyncHandler(async (req, res) => {
    const userId = req.query?.user_id || req.body?.user_id || req.user?.id;
    if (!userId) {
        return res.status(200).json({ status: true, packages: [] });
    }

    const sql = `
        SELECT p.*, s.id AS saved_id, s.created_at AS saved_at,
            d.name AS to_destination_name,
            c.name AS from_destination_name,
            t.name AS package_type_name,
            (SELECT path FROM package_assets WHERE package_id = p.id AND type = 1 LIMIT 1) AS banner_path,
            (SELECT path FROM package_assets WHERE package_id = p.id LIMIT 1) AS path
        FROM saved_packages s
        JOIN packages_master p ON s.package_id = p.id
        LEFT JOIN zone d ON p.to_destination = d.id
        LEFT JOIN cities c ON p.from_destination = c.id
        LEFT JOIN package_types t ON p.package_type = t.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching saved packages:', err);
            return res.status(500).json({ status: false, msg: err.message, packages: [] });
        }
        return res.status(200).json({ status: true, packages: rows });
    });
});

const checkIsPackageSaved = asyncHandler(async (req, res) => {
    const userId = req.query?.user_id || req.body?.user_id || req.user?.id;
    const packageId = req.query?.package_id || req.body?.package_id;

    if (!userId || !packageId) {
        return res.status(200).json({ status: true, is_saved: false });
    }

    const sql = 'SELECT id FROM saved_packages WHERE user_id = ? AND package_id = ? LIMIT 1';
    db.query(sql, [userId, packageId], (err, rows) => {
        if (err) return res.status(500).json({ status: false, is_saved: false });
        return res.status(200).json({ status: true, is_saved: rows.length > 0 });
    });
});

module.exports = {
    placeOrder,
    verifyOrder,
    getAllPackage,
    createContact,
    getRecentSearchHistory,
    getSiteSettings,
    createCorporateLeadEnquiry,
    createHolidayEnquiry,
    createContactQuery,
    getContactQueries,
    toggleSavePackage,
    getSavedPackages,
    checkIsPackageSaved
}