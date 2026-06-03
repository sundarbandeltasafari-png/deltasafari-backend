const connection = require('../../../Connection');
const md5 = require('md5');

// Zone
function getAllZoneModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM zone ORDER BY id DESC', (err, rows) => {
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

function getAllZoneConditionModel(condition) {
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `${key} IS NULL` :`${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM zone  ${customcondition} ORDER BY sort_order DESC`, (err, rows) => {
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

function getParticularZoneModel(condition) {
    const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => `${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM zone ${customcondition} ORDER BY id DESC`, [condition], (err, rows) => {
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

function createZoneModel(ZoneData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO zone SET ?', ZoneData, (err, rows) => {
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

function setZoneModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE zone SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteZoneModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM zone WHERE id = ?', id, (err, rows) => {
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
    getAllZoneModel,
    getAllZoneConditionModel,
    getParticularZoneModel,
    createZoneModel,
    setZoneModel,
    deleteZoneModel,
}