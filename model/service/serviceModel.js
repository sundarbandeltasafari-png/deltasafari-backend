const connection = require('../../Connection');
const md5 = require('md5');

function getAllPackagesModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subscription_master WHERE status = 1 ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function getAllPackagesDetails(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subscription_master WHERE id = ?', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function createSubscription(subscription) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO my_subscription SET ?', subscription, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });

    })
}

function getUserSubscriptionsModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM my_subscription WHERE status = 1 AND user_id = ? ORDER BY id DESC', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function updateSubscription(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE my_subscription SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function createSearchHistoryModel(history) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO search_history SET ?', history, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });

    })
}

function getSearchHistoryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM search_history WHERE status = 1 AND user_id = ? ORDER BY id DESC', id, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function getAllLanguagesModel() { 
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM language_master WHERE status = 1 ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function getStudyProfileModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM study_profile WHERE status = 1 ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function getAllSubjectsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subject_master WHERE status = 1 ORDER BY id DESC', (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function createContactModel(contact) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO contacts SET ?', contact, (err, rows) => {
            if (err) {
                console.error('Error selecting data:', err);
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });

    })
}

function getRecentSearchHistoryModel(id, like) {
    const queryLike = `%${like}%`
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM search_history WHERE status = 1 AND user_id = ? AND created_on LIKE ? ORDER BY id DESC', [id, queryLike], (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if(rows){
                resolve(JSON.parse(JSON.stringify(rows)));
            }else{
                resolve([]);
            }
        });
    })
}

function getAllPostsConditionModel(condition) {
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `posts.${key} IS NULL` :`posts.${key} = ${value}`) // custom "=>" separator
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
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `posts.${key} IS NULL` :`posts.${key} = ${value}`) // custom "=>" separator
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
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `${key} IS NULL` :`${key} = ${value}`) // custom "=>" separator
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
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `categories.${key} IS NULL` :`categories.${key} = '${value}'`) // custom "=>" separator
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


function getTopTagsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tags ORDER BY id DESC LIMIT 10', (err, rows) => {
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

function getAllBreakingPostsConditionModel(condition) {
     const customcondition = condition ? "WHERE " +Object.entries(condition)
        .map(([key, value]) => value == '' ? `posts.${key} IS NULL` :`posts.${key} = ${value}`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM posts ${customcondition} ORDER BY id DESC LIMIT 4`, (err, rows) => {
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

module.exports = {getAllPackagesModel, getAllPackagesDetails, createSubscription, getUserSubscriptionsModel, updateSubscription, createSearchHistoryModel, getSearchHistoryModel, getAllLanguagesModel,getStudyProfileModel, getAllSubjectsModel, createContactModel, getRecentSearchHistoryModel, getAllPostsConditionModel, getAllCategorysConditionModel, getParticularPostModel, getAllPostsByCategoryModel, getTopTagsModel, getAllBreakingPostsConditionModel}