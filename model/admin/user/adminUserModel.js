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
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master WHERE ${customcondition} AND user_master.first_name LIKE '%${searchData}%' OR ${customcondition} AND user_master.last_name LIKE '%${searchData}%' ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    })
}

function getParticularAdminUserModel(id) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.*, u.date as created_at,
                   pg.name as role_name,
                   a.street, a.city as address_city, a.state, a.zip_code, a.country as address_country,
                   GROUP_CONCAT(CONCAT(s.platform, ':::', s.url) SEPARATOR '|||') as socials_joined
            FROM user_master u
            LEFT JOIN permision_group pg ON pg.id = u.permision_group_id
            LEFT JOIN addresses a ON a.user_id = u.id
            LEFT JOIN socials s ON s.user_id = u.id
            WHERE u.id = ? AND u.admin IN (1, 2)
            GROUP BY u.id
        `;
        connection.query(query, [id], (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(null);
            const user = rows[0];
            const socials = {};
            if (user.socials_joined) {
                user.socials_joined.split('|||').forEach(item => {
                    const [plat, url] = item.split(':::');
                    if (plat) socials[plat] = url;
                });
            }
            user.socials = socials;
            resolve(user);
        });
    });
}

function getAdminUsersPaginatedModel({ page = 1, limit = 25, search = '', status = '', role = '' }) {
    return new Promise((resolve, reject) => {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 25);
        const offset = (pageNum - 1) * limitNum;

        let whereClauses = [`u.admin = 2`];
        let params = [];

        if (status !== '' && status !== undefined && status !== null) {
            whereClauses.push(`u.status = ?`);
            params.push(parseInt(status));
        }

        if (role !== '' && role !== undefined && role !== null) {
            whereClauses.push(`(u.permision_group_id = ? OR u.role_id = ?)`);
            params.push(parseInt(role), parseInt(role));
        }

        if (search && search.toString().trim() !== '') {
            const s = `%${search.toString().trim()}%`;
            whereClauses.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`);
            params.push(s, s, s, s);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM user_master u ${whereSql}`;
        connection.query(countQuery, params, (countErr, countRows) => {
            if (countErr) return reject(countErr);
            const total = countRows?.[0]?.total || 0;

            const dataQuery = `
                SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_picture, u.profile_pic, u.status, u.admin, 
                       u.permision_group_id, u.role_id, u.date as created_at,
                       pg.name as role_name
                FROM user_master u
                LEFT JOIN permision_group pg ON pg.id = u.permision_group_id
                ${whereSql}
                ORDER BY u.id DESC
                LIMIT ? OFFSET ?
            `;
            const dataParams = [...params, limitNum, offset];
            connection.query(dataQuery, dataParams, (dataErr, rows) => {
                if (dataErr) return reject(dataErr);
                const list = rows ? JSON.parse(JSON.stringify(rows)) : [];
                resolve({
                    adminUsers: list,
                    total: total,
                    page: pageNum,
                    limit: limitNum,
                    hasMore: (offset + list.length) < total
                });
            });
        });
    });
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
    getSearchUsersModel,
    getParticularAdminUserModel,
    getAdminUsersPaginatedModel
}