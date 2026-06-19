const connection = require('../../Connection');
const md5 = require('md5');

function getAllPostsConditionModel(condition) {
    const customcondition = condition ? "WHERE " + Object.entries(condition)
        .map(([key, value]) => value == '' ? `posts.${key} IS NULL` : `posts.${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT posts.*, videos.path, categories.name as category_name, categories.slug as category_slug FROM posts LEFT JOIN videos ON posts.featured_video = videos.id LEFT JOIN categories ON posts.category_id = categories.id ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getParticularPostModel(condition) {
    const customcondition = condition ? "WHERE " + Object.entries(condition)
        .map(([key, value]) => value == '' ? `posts.${key} IS NULL` : `posts.${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT posts.*, videos.path FROM posts LEFT JOIN videos ON posts.featured_video = videos.id ${customcondition} ORDER BY id DESC`, (err, rows) => {
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
    const customcondition = condition ? "WHERE " + Object.entries(condition)
        .map(([key, value]) => value == '' ? `${key} IS NULL` : `${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    // console.log(customcondition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM categories  ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getAllPostsByCategoryModel(condition) {
    const customcondition = condition ? "WHERE " + Object.entries(condition)
        .map(([key, value]) => value == '' ? `categories.${key} IS NULL` : `categories.${key} = '${value}'`) // custom "=>" separator
        .join(" AND ") : '';
    // console.log("customcondition");
    return new Promise((resolve, reject) => {
        connection.query(`SELECT posts.*, videos.path FROM posts LEFT JOIN videos ON posts.featured_video = videos.id LEFT JOIN categories ON posts.category_id = categories.id ${customcondition}  ORDER BY id DESC`, (err, rows) => {
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


module.exports = { getAllPostsConditionModel, getAllCategorysConditionModel, getParticularPostModel, getAllPostsByCategoryModel }