const md5 = require('md5');
const { connect } = require('../../../Connection');
const connection = require('../../../Connection');
const { buildCondition } = require('../../../helper/modelHelper');

function getAllUsersModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, 
        reject) => {
        connection.query(`SELECT * FROM user_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function setUserModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteUserModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM user_master WHERE id = ?', id, (err, rows) => {
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

// Reporter & User & Admin User
function insertUserModel(details) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT user_master SET ?', [details], (err, rows) => {
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

function insertUserAddressModel(details) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT addresses SET ?', [details], (err, rows) => {
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

function insertUserSocialModel(details) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT socials SET ?', [details], (err, rows) => {
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

function getAllUserModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getParticularUserModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getUserStatusModel(condition) {
    const customcondition = buildCondition(condition)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return new Promise((resolve, reject) => {
        connection.query(`WITH Overall AS (
            SELECT COUNT(id) as grand_total FROM user_master ${customcondition}
        ),
        MonthlyCounts AS ( 
            SELECT 
                DATE_FORMAT(date, '%Y-%m') AS month_label,
                COUNT(id) AS user_count, 
                LAG(COUNT(id)) OVER (ORDER BY DATE_FORMAT(date, '%Y-%m')) AS prev_count 
            FROM user_master 
            ${customcondition} 
            GROUP BY month_label 
        ) 
        SELECT 
            '${year+"-"+month}' AS target_month,
            o.grand_total AS total_all_time,
            COALESCE(m.user_count, 0) AS this_month_new, 
            COALESCE(m.prev_count, 0) AS last_month_new,
            (COALESCE(m.user_count, 0) - COALESCE(m.prev_count, 0)) AS difference,
            CONCAT(
                COALESCE(ROUND(((m.user_count - m.prev_count) / NULLIF(m.prev_count, 0)) * 100, 2), 0), 
                '%'
            ) AS percentage_growth 
        FROM Overall o
        LEFT JOIN MonthlyCounts m ON m.month_label = '${year+"-"+month}'
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


function getSearchUsersModel(condition, searchData) {
    const customcondition = buildCondition(condition, false)
    // console.log(`SELECT * FROM user_master ${customcondition} AND WHERE user_master.first_name LIKE %${searchData}% OR ${customcondition} AND WHERE user_master.last_name LIKE %${searchData}% ORDER BY id DESC`)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master WHERE ${customcondition} AND  user_master.first_name LIKE '%${searchData}%' OR ${customcondition} AND user_master.last_name LIKE '%${searchData}%' ORDER BY id DESC`, (err, rows) => {
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

module.exports = { 
    getAllUsersModel, 
    setUserModel, 
    deleteUserModel, 
    insertUserModel, 
    insertUserAddressModel, 
    insertUserSocialModel, 
    getAllUserModel, 
    getUserStatusModel, 
    getParticularUserModel,
    getSearchUsersModel
}