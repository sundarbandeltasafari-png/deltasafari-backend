const connection = require('../../../Connection');
const md5 = require('md5');

// Language
function getAllLanguagesModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM language_master ORDER BY id DESC', (err, rows) => {
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

function createLanguageModel(languageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO language_master SET ?', languageData, (err, rows) => {
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

function setLanguageModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE language_master SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteLanguageModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM language_master WHERE id = ?', id, (err, rows) => {
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

// Study Profile
function getStudyProfileModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM study_profile ORDER BY id DESC', (err, rows) => {
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

function createStudyProfileModel(studyProfileData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO study_profile SET ?', studyProfileData, (err, rows) => {
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

function setStudyProfileModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE study_profile SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteStudyProfileModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM study_profile WHERE id = ?', id, (err, rows) => {
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

// Subjects
function getAllSubjectsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subject_master ORDER BY id DESC', (err, rows) => {
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

function createSubjectModel(subjectData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO subject_master SET ?', subjectData, (err, rows) => {
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

function setSubjectModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE subject_master SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteSubjectModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM subject_master WHERE id = ?', id, (err, rows) => {
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


// Subscription
function getAllSubscriptionModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM subscription_master ORDER BY id DESC', (err, rows) => {
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
function createSubscriptionModel(subscriptionData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO subscription_master SET ?', subscriptionData, (err, rows) => {
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

function setSubscriptionModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE subscription_master SET ? WHERE id = ?', [details, id], (err, rows) => {
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

function deleteSubscriptionModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('DELETE FROM subscription_master WHERE id = ?', id, (err, rows) => {
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


function getUserSubscriptionsModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT my_subscription.*, user_master.first_name, user_master.last_name, user_master.email, subscription_master.name  FROM my_subscription LEFT JOIN user_master ON my_subscription.user_id = user_master.id LEFT JOIN subscription_master ON my_subscription.package_id = subscription_master.id WHERE my_subscription.status = 1 AND my_subscription.user_id = ? ORDER BY my_subscription.id DESC', id, (err, rows) => {
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

function getSubscriptionsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT my_subscription.*, user_master.first_name, user_master.last_name, user_master.email, subscription_master.name  FROM my_subscription LEFT JOIN user_master ON my_subscription.user_id = user_master.id LEFT JOIN subscription_master ON my_subscription.package_id = subscription_master.id WHERE my_subscription.status = 1 ORDER BY my_subscription.id DESC', (err, rows) => {
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

function getSearchHistoryModel(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM search_history WHERE user_id = ? ORDER BY id DESC', id, (err, rows) => {
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

function getDashboardSubscriptionModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total, SUM(my_subscription.amount) as amount FROM my_subscription WHERE my_subscription.status = 1 ORDER BY my_subscription.id DESC', (err, rows) => {
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

function getDashboardSubscriptionModelByDate(like) {
    const queryLike = `%${like}%`
    return new Promise((resolve, reject) => {
        connection.query('SELECT SUM(my_subscription.amount) as amount FROM my_subscription WHERE my_subscription.status = 1 AND my_subscription.created_on LIKE ? ORDER BY my_subscription.id DESC', queryLike, (err, rows) => {
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

function getDashboardSearchModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total FROM search_history WHERE search_history.created_on ORDER BY search_history.id DESC', (err, rows) => {
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

function getDashboardSearchModelByDate(like) {
    const queryLike = `%${like}%`
    return new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as total FROM search_history WHERE search_history.created_on LIKE ? ORDER BY search_history.id DESC', queryLike, (err, rows) => {
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

function getDashboardSearchModelOccurance(field) {
    const query = `SELECT ${field} as type, COUNT(search_history.${field}) as occurance FROM search_history GROUP BY ${field} ORDER BY COUNT(search_history.${field}) DESC LIMIT 4`;
    // console.log(query)
    return new Promise((resolve, reject) => {
        connection.query(query, [field, field, field], (err, rows) => {
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

function getAllContactsModel() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM contacts ORDER BY id DESC', (err, rows) => {
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
    getStudyProfileModel,
    getAllLanguagesModel,
    createLanguageModel,
    setLanguageModel,
    deleteLanguageModel,
    createStudyProfileModel,
    setStudyProfileModel,
    deleteStudyProfileModel,
    getAllSubjectsModel,
    createSubjectModel,
    setSubjectModel,
    deleteSubjectModel,
    getAllSubscriptionModel,
    createSubscriptionModel,
    setSubscriptionModel,
    deleteSubscriptionModel,
    getSearchHistoryModel,
    getUserSubscriptionsModel,
    getSubscriptionsModel,
    getDashboardSubscriptionModel,
    getDashboardSubscriptionModelByDate,
    getDashboardSearchModel,
    getDashboardSearchModelByDate,
    getDashboardSearchModelOccurance,
    getAllContactsModel
}