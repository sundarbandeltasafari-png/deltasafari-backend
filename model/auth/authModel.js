const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getParticularUser(email) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE email = ? OR phone = ?', [email, email], (err, rows) => {
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

function getParticularUserById(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE id = ?', id, (err, rows) => {
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


function createUser(userData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO user_master SET ?', userData, (err, rows) => {
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

function getParticularUserDetails(condition1, condition2) {
    const customcondition1 = buildCondition(condition1, false);
    const customcondition2 = buildCondition(condition2, false);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master WHERE ${customcondition1} OR ${customcondition2}`, (err, rows) => {
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


function getTokenUser(id, email) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_master WHERE id = ? AND email = ? OR id = ? AND phone = ?', [id, email, id, email,], (err, rows) => {
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

function setUser(details, email) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE email = ? OR phone = ?', [details, email, email], (err, rows) => {
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

function setUserById(details, id) {
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

function setUserByOtp(details, email, otp) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE user_master SET ? WHERE otp = ? AND email = ? OR otp = ? AND phone = ?', [details, otp, email, otp, email], (err, rows) => {
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



module.exports = { getParticularUser, createUser, getTokenUser, setUser, setUserByOtp, setUserById, getParticularUserById, getParticularUserDetails }