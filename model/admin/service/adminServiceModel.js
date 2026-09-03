const connection = require('../../../Connection');
const md5 = require('md5');

// Language
function getAllLanguagesModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM language_master ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function createLanguageModel(languageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO language_master SET ?', languageData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function setLanguageModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE language_master SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function deleteLanguageModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM language_master WHERE id = ?', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

// Study Profile
function getStudyProfileModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM study_profile ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function createStudyProfileModel(studyProfileData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO study_profile SET ?', studyProfileData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function setStudyProfileModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE study_profile SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function deleteStudyProfileModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM study_profile WHERE id = ?', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

// Subjects
function getAllSubjectsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subject_master ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function createSubjectModel(subjectData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO subject_master SET ?', subjectData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function setSubjectModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE subject_master SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function deleteSubjectModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM subject_master WHERE id = ?', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}


// Subscription
function getAllSubscriptionModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subscription_master ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}
function createSubscriptionModel(subscriptionData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO subscription_master SET ?', subscriptionData, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });

    })
}

function setSubscriptionModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE subscription_master SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function deleteSubscriptionModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM subscription_master WHERE id = ?', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}


function getUserSubscriptionsModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT my_subscription.*, user_master.first_name, user_master.last_name, user_master.email, subscription_master.name  FROM my_subscription LEFT JOIN user_master ON my_subscription.user_id = user_master.id LEFT JOIN subscription_master ON my_subscription.package_id = subscription_master.id WHERE my_subscription.status = 1 AND my_subscription.user_id = ? ORDER BY my_subscription.id DESC', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getSubscriptionsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT my_subscription.*, user_master.first_name, user_master.last_name, user_master.email, subscription_master.name  FROM my_subscription LEFT JOIN user_master ON my_subscription.user_id = user_master.id LEFT JOIN subscription_master ON my_subscription.package_id = subscription_master.id WHERE my_subscription.status = 1 ORDER BY my_subscription.id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getSearchHistoryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM search_history WHERE user_id = ? ORDER BY id DESC', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getDashboardSubscriptionModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total, SUM(my_subscription.amount) as amount FROM my_subscription WHERE my_subscription.status = 1 ORDER BY my_subscription.id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getDashboardSubscriptionModelByDate(like) {
    const queryLike = `%${like}%`
    return new Promise((resolve, reject) => {
        connection.query('SELECT SUM(my_subscription.amount) as amount FROM my_subscription WHERE my_subscription.status = 1 AND my_subscription.created_on LIKE ? ORDER BY my_subscription.id DESC', queryLike, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getDashboardSearchModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total FROM search_history WHERE search_history.created_on ORDER BY search_history.id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getDashboardSearchModelByDate(like) {
    const queryLike = `%${like}%`
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total FROM search_history WHERE search_history.created_on LIKE ? ORDER BY search_history.id DESC', queryLike, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getDashboardSearchModelOccurance(field) {
    const query = `SELECT ${field} as type, COUNT(search_history.${field}) as occurance FROM search_history GROUP BY ${field} ORDER BY COUNT(search_history.${field}) DESC LIMIT 4`;
    // console.log(query)
    return new Promise((resolve, reject) => {
        connection.query(query, [field, field, field], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getAllContactsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM contacts ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

// Corporate Lead Enquiries Admin Models
function getAllCorporateLeadEnquiriesModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM corporate_lead_enquiries ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularCorporateLeadEnquiryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM corporate_lead_enquiries WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function updateCorporateLeadEnquiryModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE corporate_lead_enquiries SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function queryCount(sql, params = []) {
    return new Promise((resolve) => {
        connection.query(sql, params, (err, rows) => {
            if (err || !rows || rows.length === 0) {
                resolve(0);
            } else {
                const countVal = rows[0]?.total || rows[0]?.count || 0;
                resolve(Number(countVal));
            }
        });
    });
}

function queryList(sql, params = []) {
    return new Promise((resolve) => {
        connection.query(sql, params, (err, rows) => {
            if (err || !rows) {
                resolve([]);
            } else {
                resolve(JSON.parse(JSON.stringify(rows)));
            }
        });
    });
}

function getLast6MonthsList() {
    const months = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        months.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return months;
}

async function getAdminDashboardStatsModel(timeframe = '6m') {
    let dateInterval = "DATE_SUB(NOW(), INTERVAL 6 MONTH)";
    if (timeframe === '30d') {
        dateInterval = "DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else if (timeframe === 'ytd') {
        dateInterval = "DATE_FORMAT(NOW(), '%Y-01-01')";
    }

    const [
        totalUsers,
        totalPackages,
        totalBookings,
        totalCorporateLeads,
        pendingCorporateLeads,
        convertedCorporateLeads,
        totalContacts,
        totalRevenueRow,
        monthlyRevenueRaw,
        leadStatusRaw,
        categoryBookingsRaw,
        userGrowthRaw,
        recentBookings,
        recentCorporateLeads,
        recentUsers
    ] = await Promise.all([
        queryCount('SELECT COUNT(*) as total FROM user_master'),
        queryCount('SELECT COUNT(*) as total FROM packages_master'),
        queryCount('SELECT COUNT(*) as total FROM bookings'),
        queryCount('SELECT COUNT(*) as total FROM corporate_lead_enquiries'),
        queryCount('SELECT COUNT(*) as total FROM corporate_lead_enquiries WHERE LOWER(status) = "pending" OR status = "0"'),
        queryCount('SELECT COUNT(*) as total FROM corporate_lead_enquiries WHERE LOWER(status) = "converted" OR status = "1"'),
        queryCount('SELECT COUNT(*) as total FROM contacts'),
        queryList(`
            SELECT COALESCE(SUM(COALESCE(bookings.base_price, packages_master.base_price, 0)), 0) as total_revenue 
            FROM bookings 
            LEFT JOIN packages_master ON bookings.package_id = packages_master.id
        `),
        queryList(`
            SELECT 
                DATE_FORMAT(COALESCE(b.created_on, NOW()), '%b') AS month,
                COALESCE(SUM(COALESCE(b.base_price, p.base_price, 0)), 0) AS revenue,
                COUNT(b.id) AS bookings
            FROM bookings b
            LEFT JOIN packages_master p ON b.package_id = p.id
            WHERE COALESCE(b.created_on, NOW()) >= ${dateInterval}
            GROUP BY YEAR(COALESCE(b.created_on, NOW())), MONTH(COALESCE(b.created_on, NOW())), DATE_FORMAT(COALESCE(b.created_on, NOW()), '%b')
            ORDER BY MIN(COALESCE(b.created_on, NOW())) ASC
        `),
        queryList(`
            SELECT status, COUNT(id) AS count
            FROM corporate_lead_enquiries
            GROUP BY status
        `),
        queryList(`
            SELECT 
                COALESCE(pt.name, c.category_name, 'Wilderness Safari') AS category,
                COUNT(b.id) AS count
            FROM bookings b
            JOIN packages_master p ON b.package_id = p.id
            LEFT JOIN package_types pt ON p.package_type = pt.id
            LEFT JOIN categories c ON p.package_type = c.id
            GROUP BY pt.id, pt.name, c.id, c.category_name
            ORDER BY count DESC LIMIT 5
        `),
        queryList(`
            SELECT 
                DATE_FORMAT(COALESCE(created_on, NOW()), '%b') AS month,
                COUNT(id) AS users
            FROM user_master
            WHERE COALESCE(created_on, NOW()) >= ${dateInterval}
            GROUP BY YEAR(COALESCE(created_on, NOW())), MONTH(COALESCE(created_on, NOW())), DATE_FORMAT(COALESCE(created_on, NOW()), '%b')
            ORDER BY MIN(COALESCE(created_on, NOW())) ASC
        `),
        queryList(`
            SELECT bookings.id, bookings.package_id, bookings.created_on, packages_master.title as package_title, COALESCE(bookings.base_price, packages_master.base_price, '0') as base_price
            FROM bookings 
            LEFT JOIN packages_master ON bookings.package_id = packages_master.id 
            ORDER BY bookings.id DESC LIMIT 5
        `),
        queryList('SELECT id, company_name, name, email, phone, destination, group_size, status, created_at FROM corporate_lead_enquiries ORDER BY id DESC LIMIT 5'),
        queryList('SELECT id, first_name, last_name, email, phone, created_on FROM user_master ORDER BY id DESC LIMIT 5')
    ]);

    const totalRevenue = Number(totalRevenueRow[0]?.total_revenue || 0);
    const conversionRate = totalCorporateLeads > 0 
        ? Number(((convertedCorporateLeads * 100.0) / totalCorporateLeads).toFixed(1)) 
        : 0;

    // Monthly revenue chart
    let monthly_revenue = monthlyRevenueRaw.map(item => ({
        month: item.month,
        revenue: Number(item.revenue || 0),
        bookings: Number(item.bookings || 0)
    }));

    if (monthly_revenue.length === 0) {
        const last6 = getLast6MonthsList();
        monthly_revenue = last6.map(m => ({ month: m, revenue: 0, bookings: 0 }));
    }

    // Lead status breakdown
    const defaultLeadStatuses = [
        { status: "Pending", color: "#ffc107", bgClass: "bg-warning" },
        { status: "Contacted", color: "#0dcaf0", bgClass: "bg-info" },
        { status: "In Progress", color: "#0d6efd", bgClass: "bg-primary" },
        { status: "Converted", color: "#198754", bgClass: "bg-success" },
        { status: "Closed", color: "#dc3545", bgClass: "bg-danger" }
    ];

    const leadMap = {};
    leadStatusRaw.forEach(item => {
        if (item.status) {
            leadMap[item.status.toString().toLowerCase()] = Number(item.count);
        }
    });

    const lead_status_breakdown = defaultLeadStatuses.map(item => {
        const key = item.status.toLowerCase();
        return {
            status: item.status,
            count: leadMap[key] || 0,
            color: item.color,
            bgClass: item.bgClass
        };
    });

    // Add any extra status found in DB
    leadStatusRaw.forEach(item => {
        if (item.status && !defaultLeadStatuses.some(d => d.status.toLowerCase() === item.status.toString().toLowerCase())) {
            lead_status_breakdown.push({
                status: item.status,
                count: Number(item.count),
                color: "#6c757d",
                bgClass: "bg-secondary"
            });
        }
    });

    // Category Popularity
    const categoryColors = ["#696cff", "#71dd37", "#03c3ec", "#ffab00", "#8592a3"];
    const totalCatCount = categoryBookingsRaw.reduce((sum, item) => sum + Number(item.count), 0) || totalBookings || 1;

    let category_bookings = categoryBookingsRaw.map((item, index) => {
        const count = Number(item.count);
        return {
            category: item.category || 'Safari Package',
            count: count,
            percentage: Number(((count * 100.0) / totalCatCount).toFixed(1)),
            color: categoryColors[index % categoryColors.length]
        };
    });

    if (category_bookings.length === 0) {
        category_bookings = [
            { category: "Wilderness Safari", count: 0, percentage: 0, color: "#696cff" },
            { category: "Festival Special", count: 0, percentage: 0, color: "#71dd37" },
            { category: "Bird Watching", count: 0, percentage: 0, color: "#03c3ec" },
            { category: "Luxury Resort Retreat", count: 0, percentage: 0, color: "#ffab00" }
        ];
    }

    // User growth chart
    let user_growth = userGrowthRaw.map(item => ({
        month: item.month,
        users: Number(item.users || 0)
    }));

    if (user_growth.length === 0) {
        const last6 = getLast6MonthsList();
        user_growth = last6.map(m => ({ month: m, users: 0 }));
    }

    return {
        counts: {
            total_users: totalUsers,
            total_packages: totalPackages,
            total_bookings: totalBookings,
            total_corporate_leads: totalCorporateLeads,
            pending_corporate_leads: pendingCorporateLeads,
            total_contacts: totalContacts,
            total_revenue: totalRevenue,
            conversion_rate: conversionRate
        },
        charts: {
            monthly_revenue: monthly_revenue,
            lead_status_breakdown: lead_status_breakdown,
            category_bookings: category_bookings,
            user_growth: user_growth
        },
        recent_bookings: recentBookings,
        recent_corporate_leads: recentCorporateLeads,
        recent_users: recentUsers
    };
}

// Holiday Enquiries Admin Models
function getAllHolidayEnquiriesModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM holiday_enquiries ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularHolidayEnquiryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM holiday_enquiries WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function updateHolidayEnquiryModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE holiday_enquiries SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

// Contact Queries Admin Models
function getAllContactQueriesAdminModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM contact_queries ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularContactQueryAdminModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM contact_queries WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function updateContactQueryAdminModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE contact_queries SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function deleteContactQueryAdminModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM contact_queries WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

// Bookings Admin Models
function getAllBookingsAdminModel() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT bookings.*, bookings.id as bookings_id, 
            DATE_FORMAT(bookings.departure_date, '%Y-%m-%d') as departure_date_str,
            DATE_FORMAT(bookings.created_at, '%Y-%m-%d') as created_at_str,
            packages_master.title, packages_master.slug, packages_master.duration_days, packages_master.duration_nights, packages_master.package_type,
            packages_master.agent_discount, packages_master.agent_actual_price,
            package_assets.path, package_assets.type as asset_type, 
            package_types.name as package_type_name, 
            to_destination_zone.name as to_destination_name, 
            from_destination_zone.name as from_destination_name,
            packages_master.inclusions, packages_master.exclusions,
            agent_user.first_name as agent_first_name, agent_user.last_name as agent_last_name, 
            agent_user.phone as agent_phone, agent_user.email as agent_email, agent_user.user_type as agent_user_type 
        FROM bookings 
        LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
        LEFT JOIN user_master as agent_user ON agent_user.id = bookings.user_id 
        LEFT JOIN package_assets ON packages_master.id = package_assets.package_id AND (package_assets.type = 1 OR package_assets.type IS NULL)
        LEFT JOIN package_types ON packages_master.package_type = package_types.id 
        LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
        LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
        GROUP BY bookings.id 
        ORDER BY bookings.id DESC`;

        connection.query(sql, (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularBookingAdminModel(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT bookings.*, bookings.id as bookings_id, 
            DATE_FORMAT(bookings.departure_date, '%Y-%m-%d') as departure_date_str,
            DATE_FORMAT(bookings.created_at, '%Y-%m-%d') as created_at_str,
            packages_master.title, packages_master.slug, packages_master.duration_days, packages_master.duration_nights, packages_master.package_type,
            packages_master.agent_discount, packages_master.agent_actual_price,
            package_assets.path, package_assets.type as asset_type, 
            package_types.name as package_type_name, 
            to_destination_zone.name as to_destination_name, 
            from_destination_zone.name as from_destination_name,
            packages_master.inclusions, packages_master.exclusions,
            agent_user.first_name as agent_first_name, agent_user.last_name as agent_last_name, 
            agent_user.phone as agent_phone, agent_user.email as agent_email, agent_user.user_type as agent_user_type 
        FROM bookings 
        LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
        LEFT JOIN user_master as agent_user ON agent_user.id = bookings.user_id 
        LEFT JOIN package_assets ON packages_master.id = package_assets.package_id AND (package_assets.type = 1 OR package_assets.type IS NULL)
        LEFT JOIN package_types ON packages_master.package_type = package_types.id 
        LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
        LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
        WHERE bookings.id = ? 
        GROUP BY bookings.id`;

        connection.query(sql, [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function updateBookingAdminModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE bookings SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function deleteBookingAdminModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM bookings WHERE id = ?', [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

module.exports = {
    getStudyProfileModel,
    getAllLanguagesModel,
    createLanguageModel,
    setLanguageModel,
    deleteLanguageModel,
    createStudyProfileModel,
    setStudyProfileModel,
    deleteStudyProfileModel,
    getAllSubjectsModel,
    createSubjectModel,
    setSubjectModel,
    deleteSubjectModel,
    getAllSubscriptionModel,
    createSubscriptionModel,
    setSubscriptionModel,
    deleteSubscriptionModel,
    getSearchHistoryModel,
    getUserSubscriptionsModel,
    getSubscriptionsModel,
    getDashboardSubscriptionModel,
    getDashboardSubscriptionModelByDate,
    getDashboardSearchModel,
    getDashboardSearchModelByDate,
    getDashboardSearchModelOccurance,
    getAllContactsModel,
    getAllCorporateLeadEnquiriesModel,
    getParticularCorporateLeadEnquiryModel,
    updateCorporateLeadEnquiryModel,
    getAdminDashboardStatsModel,
    getAllHolidayEnquiriesModel,
    getParticularHolidayEnquiryModel,
    updateHolidayEnquiryModel,
    getAllContactQueriesAdminModel,
    getParticularContactQueryAdminModel,
    updateContactQueryAdminModel,
    deleteContactQueryAdminModel,
    getAllBookingsAdminModel,
    getParticularBookingAdminModel,
    updateBookingAdminModel,
    deleteBookingAdminModel
}