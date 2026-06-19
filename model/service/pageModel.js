const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getAllPagesConditionModel(condition) {
    const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM page_master ${customcondition} ORDER BY id DESC`, (err, rows) => {
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

function getParticularPagesConditionModel(condition) {
    const customcondition = buildCondition(condition);
    // console.log(customcondition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT common_page.*, page_master.page_name FROM page_master LEFT JOIN common_page ON common_page.page_id = page_master.id ${customcondition} ORDER BY id DESC`, (err, rows) => {
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


module.exports = {getAllPagesConditionModel, getParticularPagesConditionModel}