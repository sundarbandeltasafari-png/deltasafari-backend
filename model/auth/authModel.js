const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getParticularUser(condition) {
    const customcondition = buildCondition(condition, false);
    const sql = customcondition ? `SELECT * FROM user_master WHERE ${customcondition.trim()}` : 'SELECT * FROM user_master';
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.error("Database query error in getParticularUser:", err.message);
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function createUser(userData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO user_master SET ?', userData, (err, rows) => {
            if (err) {
                console.error('Error creating user in database:', err);
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularUserDetails(condition1, condition2) {
    const customcondition1 = buildCondition(condition1, false);
    const customcondition2 = condition2 ? buildCondition(condition2, false) : '';
    
    let sql = 'SELECT * FROM user_master';
    const c1 = customcondition1 ? customcondition1.trim() : '';
    const c2 = customcondition2 ? customcondition2.trim() : '';

    if (c1 && c2) {
        sql += ` WHERE (${c1}) OR (${c2})`;
    } else if (c1) {
        sql += ` WHERE ${c1}`;
    } else if (c2) {
        sql += ` WHERE ${c2}`;
    }

    return new Promise((resolve, reject) => {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.error("Database query error in getParticularUserDetails:", err.message, "SQL:", sql);
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function setUser(details, email) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE email = ? OR phone = ?', [details, email, email], (err, rows) => {
            if (err) {
                console.error("Database query error in setUser:", err.message);
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function setUserByOtp(details, email, otp) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE otp = ? AND (email = ? OR phone = ?)', [details, otp, email, email], (err, rows) => {
            if (err) {
                console.error("Database query error in setUserByOtp:", err.message);
                reject(new Error("Something went wrong in database: " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

module.exports = { getParticularUser, createUser, setUser, setUserByOtp, getParticularUserDetails };