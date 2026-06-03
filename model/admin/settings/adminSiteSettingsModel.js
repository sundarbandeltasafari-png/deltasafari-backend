const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');


function getParticularSiteSettingsModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM site_settings ${customcondition} ORDER BY id DESC`, [condition], (err, rows) => {
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


function setSiteSettingsModel(details, condition) {
    const customcondition = buildCondition(condition);
    const safeDetails = {};
    Object.keys(details).forEach(key => {
        if (details[key] !== null && details[key] !== undefined && details[key] !== '') {
            safeDetails[key] = details[key];
        }
    });

    return new Promise((resolve, reject) => {
        connection.query(`UPDATE site_settings SET ? ${customcondition}`, [safeDetails], (err, rows) => {
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

module.exports= {
    getParticularSiteSettingsModel,
    setSiteSettingsModel
}