const md5 = require('md5');
const { connect } = require('../../../Connection');
const connection = require('../../../Connection');
const { buildCondition } = require('../../../helper/modelHelper');

function getAllPermisionMainModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM main_routes ${customcondition} ORDER BY id DESC`, (err, rows) => {
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
                                    'name', main_routes.name
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
                ON main_routes.id = permision_route.route

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

module.exports = { 
    getAllPermisionMainModel, 
    insertGroup, 
    insertPermisionRoute, 
    getAllPermisionsModel,
    updateGroupModel,
    deletePermisionRouteModel
}