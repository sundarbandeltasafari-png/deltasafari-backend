const md5 = require('md5');
const { connect } = require('../../../Connection');
const connection = require('../../../Connection');
const { buildCondition } = require('../../../helper/modelHelper');

const SYSTEM_SIDEBAR_ROUTES = [
    { id: 1, name: 'Dashboards', route: '/dashboard', status: 1 },
    { id: 3, name: 'Cities', route: '/cities', status: 1 },
    { id: 4, name: 'Package', route: '/package', status: 1 },
    { id: 5, name: 'Hotels', route: '/hotels', status: 1 },
    { id: 6, name: 'Calendar', route: '/calendar', status: 1 },
    { id: 7, name: 'Bookings', route: '/bookings', status: 1 },
    { id: 8, name: 'Corporate Lead', route: '/corporate-lead', status: 1 },
    { id: 9, name: 'Custom Package', route: '/custom-package', status: 1 },
    { id: 10, name: 'Website Settings', route: '/websitesettings', status: 1 },
    { id: 11, name: 'General Settings', route: '/generalsettings', status: 1 },
    { id: 12, name: 'FAQ Pages', route: '/faqpages', status: 1 },
    { id: 13, name: 'SEO Pages', route: '/seopages', status: 1 },
    { id: 14, name: 'Common Pages', route: '/commonpages', status: 1 },
    { id: 15, name: 'Contacts', route: '/contacts', status: 1 },
    { id: 18, name: 'Users', route: '/users', status: 1 },
    { id: 19, name: 'Permision Group', route: '/permision', status: 1 },
    { id: 20, name: 'Admin Users', route: '/adminusers', status: 1 },
    { id: 21, name: 'Referral Program', route: '/referrals', status: 1 }
];

const isExcludedRoute = (name = '', route = '') => {
    const n = name.toLowerCase().trim();
    const r = route.toLowerCase().trim();
    return (
        n.includes('crm') || 
        n.includes('whatsapp') || 
        n.includes('news') || 
        n.includes('blog') || 
        n.includes('reporter') || 
        n.includes('zone') || 
        n.includes('destination') ||
        r.includes('crm') || 
        r.includes('whatsapp') || 
        r.includes('news') || 
        r.includes('reporter') || 
        r.includes('zone')
    );
};

function getAllPermisionMainModel(condition) {
    return new Promise((resolve) => {
        connection.query(`SELECT * FROM main_routes ORDER BY id ASC`, (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return resolve(SYSTEM_SIDEBAR_ROUTES);
            }

            const dbRows = JSON.parse(JSON.stringify(rows));
            const formatted = dbRows.map(r => ({
                id: r.id,
                name: r.name,
                route: r.viewpath || r.route || '',
                viewpath: r.viewpath || r.route || '',
                status: r.status
            })).filter(r => !isExcludedRoute(r.name, r.route));

            resolve(formatted);
        });
    });
}

function insertGroup(details) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT permision_group SET ?', [details], (err, rows) => {
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

function insertPermisionRoute(details) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT permision_route SET ?', [details], (err, rows) => {
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

function getAllPermisionsModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT 
                    permision_group.id,
                    permision_group.name,
                    permision_group.status,
                    permision_group.created_at,
                    IFNULL(
                        CONCAT(
                            '[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'route_id', permision_route.id,
                                    'route_name', permision_route.route,
                                    'view_route', permision_route.view_route,
                                    'add_route', permision_route.add_route,
                                    'edit_route', permision_route.edit_route,
                                    'route', COALESCE(main_routes.viewpath, permision_route.route),
                                    'name', COALESCE(main_routes.name, permision_route.route)
                                )
                            ),
                            ']'
                        ),
                        '[]'
                    ) AS routes

                FROM permision_group permision_group

                LEFT JOIN permision_route
                ON permision_group.id = permision_route.permision_group_id

                LEFT JOIN main_routes 
                ON (main_routes.id = permision_route.route OR main_routes.viewpath = permision_route.route)

                ${customcondition}
                
                GROUP BY permision_group.id
            `, (err, rows) => {
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


function updateGroupModel(details, condition) {
    const customcondition = buildCondition(condition);
    console.log(customcondition)
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE permision_group SET ? ${customcondition}`, [details], (err, rows) => {
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

function deletePermisionRouteModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM permision_route ${customcondition}`, (err, rows) => {
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



// // Reporter & User
// function insertUserModel(details) {
//     return new Promise((resolve, reject) => {
//         connection.query('INSERT user_master SET ?', [details], (err, rows) => {
//             if (err) {
//                 reject(new Error("Something went worng in database!" + err?.message));
//             }
//             if (rows) {
//                 resolve(JSON.parse(JSON.stringify(rows)));
//             } else {
//                 resolve([]);
//             }
//         });
//     })
// }

// function insertUserAddressModel(details) {
//     return new Promise((resolve, reject) => {
//         connection.query('INSERT addresses SET ?', [details], (err, rows) => {
//             if (err) {
//                 reject(new Error("Something went worng in database!" + err?.message));
//             }
//             if (rows) {
//                 resolve(JSON.parse(JSON.stringify(rows)));
//             } else {
//                 resolve([]);
//             }
//         });
//     })
// }

// function insertUserSocialModel(details) {
//     return new Promise((resolve, reject) => {
//         connection.query('INSERT socials SET ?', [details], (err, rows) => {
//             if (err) {
//                 reject(new Error("Something went worng in database!" + err?.message));
//             }
//             if (rows) {
//                 resolve(JSON.parse(JSON.stringify(rows)));
//             } else {
//                 resolve([]);
//             }
//         });
//     })
// }

// function getAllUserModel(condition) {
//     const customcondition = condition ? "WHERE " + Object.entries(condition)
//         .map(([key, value]) => value == '' && value != 0 ? `${key} IS NULL` : `${key} = ${value}`) // custom "=>" separator
//         .join(" AND ") : '';
//     return new Promise((resolve, reject) => {
//         connection.query(`SELECT * FROM user_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
//             if (err) {
//                 reject(new Error("Something went worng in database!" + err?.message));
//             }
//             if (rows) {
//                 resolve(JSON.parse(JSON.stringify(rows)));
//             } else {
//                 resolve([]);
//             }
//         });
//     })
// }

// function getUserStatusModel(condition) {
//     const customcondition = condition ? "WHERE " + Object.entries(condition)
//         .map(([key, value]) => value == '' ? `${key} IS NULL` : `${key} = ${value}`) // custom "=>" separator
//         .join(" AND ") : '';
//     const now = new Date();
//     const month = now.getMonth() + 1;
//     const year = now.getFullYear();

//     return new Promise((resolve, reject) => {
//         connection.query(`WITH Overall AS (
//             SELECT COUNT(id) as grand_total FROM user_master ${customcondition}
//         ),
//         MonthlyCounts AS ( 
//             SELECT 
//                 DATE_FORMAT(date, '%Y-%m') AS month_label,
//                 COUNT(id) AS user_count, 
//                 LAG(COUNT(id)) OVER (ORDER BY DATE_FORMAT(date, '%Y-%m')) AS prev_count 
//             FROM user_master 
//             ${customcondition} 
//             GROUP BY month_label 
//         ) 
//         SELECT 
//             '${year+"-"+month}' AS target_month,
//             o.grand_total AS total_all_time,
//             COALESCE(m.user_count, 0) AS this_month_new, 
//             COALESCE(m.prev_count, 0) AS last_month_new,
//             (COALESCE(m.user_count, 0) - COALESCE(m.prev_count, 0)) AS difference,
//             CONCAT(
//                 COALESCE(ROUND(((m.user_count - m.prev_count) / NULLIF(m.prev_count, 0)) * 100, 2), 0), 
//                 '%'
//             ) AS percentage_growth 
//         FROM Overall o
//         LEFT JOIN MonthlyCounts m ON m.month_label = '${year+"-"+month}'
//         `, (err, rows) => {
//             if (err) {
//                 reject(new Error("Something went worng in database!" + err?.message));
//             }
//             if (rows) {
//                 resolve(JSON.parse(JSON.stringify(rows)));
//             } else {
//                 resolve([]);
//             }
//         });
//     })
// }

function countUsersByPermissionGroupModel(groupId) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT COUNT(*) AS user_count FROM user_master WHERE permision_group_id = ? OR role_id = ?`,
            [groupId, groupId],
            (err, rows) => {
                if (err) {
                    reject(new Error("Database error while checking assigned users: " + err?.message));
                } else {
                    resolve(rows && rows.length > 0 ? rows[0].user_count : 0);
                }
            }
        );
    });
}

function deletePermisionGroupModel(groupId) {
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM permision_route WHERE permision_group_id = ?`, [groupId], (rErr) => {
            if (rErr) {
                return reject(new Error("Error deleting permission routes: " + rErr?.message));
            }
            connection.query(`DELETE FROM permision_group WHERE id = ?`, [groupId], (gErr, result) => {
                if (gErr) {
                    return reject(new Error("Error deleting permission group: " + gErr?.message));
                }
                resolve(result);
            });
        });
    });
}

module.exports = { 
    getAllPermisionMainModel, 
    insertGroup, 
    insertPermisionRoute, 
    getAllPermisionsModel,
    updateGroupModel,
    deletePermisionRouteModel,
    countUsersByPermissionGroupModel,
    deletePermisionGroupModel
}