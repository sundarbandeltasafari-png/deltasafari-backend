const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

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

function getSiteSettingsConditionModel(condition) {
    const customcondition = buildCondition(condition);
    // console.log(customcondition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM site_settings ${customcondition} ORDER BY id DESC`, (err, rows) => {
            if (err) {
                reject(new Error("Something went worng in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)) ? JSON.parse(JSON.stringify(rows))[0] : null);
            } else {
                resolve([]);
            }
        });
    })
}

module.exports = {
    getAllPackagesModel, 
    getAllPackagesDetails, 
    createSubscription, 
    getUserSubscriptionsModel, 
    updateSubscription, 
    createSearchHistoryModel, 
    getSearchHistoryModel, 
    getAllLanguagesModel, 
    createContactModel, 
    getRecentSearchHistoryModel,
    getSiteSettingsConditionModel
}