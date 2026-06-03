const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');


function getPagesModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM page_master ${customcondition}`, [condition], (err, rows) => {
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

function getFaqPageModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT faq_master.*, page_master.page_name FROM page_master LEFT JOIN faq_master ON page_master.id = faq_master.page_id ${customcondition}`, [condition], (err, rows) => {
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

function createFaqPageSettingsModel(faqdata) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO faq_master SET ?', faqdata, (err, rows) => {
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

function deleteFaqPageSettingsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM faq_master ${customcondition}`, (err, rows) => {
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

function getSeoPageModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT seo_master.*, page_master.page_name FROM page_master LEFT JOIN seo_master ON page_master.id = seo_master.page_id ${customcondition}`, [condition], (err, rows) => {
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

function createSeoPageSettingsModel(faqdata) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO seo_master SET ?', faqdata, (err, rows) => {
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

function deleteSeoPageSettingsModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM seo_master ${customcondition}`, (err, rows) => {
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


function getOfficeAddressModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM offices`, (err, rows) => {
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

function createOfficeAddressModel(faqdata) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO offices SET ?', faqdata, (err, rows) => {
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

function deleteOfficeAddressModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM offices ${customcondition}`, (err, rows) => {
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

function getContactChanelModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM contact_channels WHERE id = 1`, (err, rows) => {
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

function setContactChanelModel(details, condition) {
    const customcondition = buildCondition(condition);
    const safeDetails = {};
    Object.keys(details).forEach(key => {
        if (details[key] !== null && details[key] !== undefined && details[key] !== '') {
            safeDetails[key] = details[key];
        }
    });

    return new Promise((resolve, reject) => {
        connection.query(`UPDATE contact_channels SET ? ${customcondition}`, [safeDetails], (err, rows) => {
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
    getPagesModel,
    setSiteSettingsModel,
    getFaqPageModel,
    deleteFaqPageSettingsModel,
    createFaqPageSettingsModel,
    getSeoPageModel,
    deleteSeoPageSettingsModel,
    createSeoPageSettingsModel,
    getOfficeAddressModel,
    getContactChanelModel,
    createOfficeAddressModel,
    deleteOfficeAddressModel,
    setContactChanelModel
}