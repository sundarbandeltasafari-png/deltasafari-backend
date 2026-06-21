const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');

// City

function getAllCityConditionModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM cities ORDER BY id DESC`, (err, rows) => {
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

function getAllCountriesConditionModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM country_master ORDER BY country_id ASC`, (err, rows) => {
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

function getParticularCityModel(condition) {
    const newCondition = condition && Object.entries(condition).map(([key, value]) => ({ [`cities.${key}`]: value }))
    const customcondition = condition && buildCondition(Object.assign({}, ...newCondition));
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM cities ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                const newRows = JSON.parse(JSON.stringify(rows))
                resolve(newRows.length > 0 ? newRows[0] : []);
            } else {
                resolve([]);
            }
        });
    })
}

function createCityModel(CityData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO cities SET ?', CityData, (err, rows) => {
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

function updateCityModel(details, condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE cities SET ? ${customcondition}`, [details], (err, rows) => {
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

function deleteCityModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM cities ${customcondition}`, (err, rows) => {
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
    getAllCityConditionModel,
    getParticularCityModel,
    createCityModel,
    updateCityModel,
    getAllCountriesConditionModel,
    deleteCityModel
}