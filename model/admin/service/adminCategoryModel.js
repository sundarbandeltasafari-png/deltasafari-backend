const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');

// Category
function getAllCategorysModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM categories ORDER BY id DESC', (err, rows) => {
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

function getAllCategorysConditionModel(condition) {
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `${key} IS NULL` :`${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM categories  ${customcondition} ORDER BY sort_order DESC`, (err, rows) => {
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

function getParticularCategorysModel(condition) {
    const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => `${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM categories ${customcondition} ORDER BY id DESC`, [condition], (err, rows) => {
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

function createCategoryModel(CategoryData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO categories SET ?', CategoryData, (err, rows) => {
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

function setCategoryModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE categories SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteCategoryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM categories WHERE id = ?', id, (err, rows) => {
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
    getAllCategorysModel,
    getAllCategorysConditionModel,
    getParticularCategorysModel,
    createCategoryModel,
    setCategoryModel,
    deleteCategoryModel
}