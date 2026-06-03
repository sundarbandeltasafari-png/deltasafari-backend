
const connection = require('../../Connection');
const md5 = require('md5');

function getParticularUser(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM user_master ${customcondition}`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                const newRow = JSON.parse(JSON.stringify(rows));
                resolve(rows.length > 0 ? rows[0] : []);
            } else {
                resolve([]);
            }
        });
    })
}


function getUserSubscriptionModel(id, status = 1) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT my_subscription.*, subscription_master.name, subscription_master.total_request as request, subscription_master.type as package_type FROM my_subscription LEFT JOIN subscription_master ON my_subscription.package_id = subscription_master.id WHERE my_subscription.user_id = ? AND my_subscription.status = ? ORDER BY my_subscription.id DESC', [id, status], (err, rows) => {
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

function updateUser(details, condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE user_master SET ? ${customcondition}`, [details], (err, rows) => {
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

module.exports = { getUserSubscriptionModel, getParticularUser, updateUser }