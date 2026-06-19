const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getHomeDestinationModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM zone ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getOfficeDetailsModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM offices ORDER BY id DESC`, (err, rows) => {
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

function getContactDetailsModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM contact_channels ORDER BY id DESC`, (err, rows) => {
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


function getFAQModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM faq_master ${customcondition} ORDER BY sort_order ASC`, (err, rows) => {
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

function getHomePostsModel(condition, type = true) {
    const customcondition = condition ? (type ? "WHERE " : ' ') + Object.entries(condition)
        .map(([key, value]) => value == '' && value != 0 ? `posts.${key} IS NULL` : `posts.${key} = '${value}'`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT posts.*, categories.name as category_name, categories.slug as category_slug FROM posts LEFT JOIN categories on categories.id = posts.category_id ${customcondition} ORDER BY posts.id DESC LIMIT 4`, (err, rows) => {
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
    getHomeDestinationModel,
    getContactDetailsModel,
    getOfficeDetailsModel,
    getFAQModel,
    getHomePostsModel
}