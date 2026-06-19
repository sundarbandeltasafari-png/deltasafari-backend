const connection = require('../../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../../helper/modelHelper');


function getParticulrPackageModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM packages_master ${customcondition} ORDER BY id DESC`, [condition], (err, rows) => {
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

function setPackageModel(details, condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE packages_master SET ? ${customcondition}`, [details], (err, rows) => {
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

function getAllPackageModel() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, package_types.name as package_type_name, to_destination_zone.name as to_destination_name, from_destination_zone.name as from_destination_name FROM packages_master 
            LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
            LEFT JOIN package_types ON packages_master.package_type  = package_types.id 
            LEFT JOIN zone AS to_destination_zone  ON packages_master.to_destination = to_destination_zone.id 
            LEFT JOIN zone AS from_destination_zone  ON packages_master.from_destination = from_destination_zone.id 
            GROUP BY package_assets.package_id ORDER BY packages_master.id DESC`, (err, rows) => {
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


function getParticularPackageModel(condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, package_types.name as package_type_name, to_destination_zone.name as to_destination_name, from_destination_zone.name as from_destination_name FROM packages_master 
            LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
            LEFT JOIN package_types ON packages_master.package_type  = package_types.id 
            LEFT JOIN zone AS to_destination_zone  ON packages_master.to_destination = to_destination_zone.id 
            LEFT JOIN zone AS from_destination_zone  ON packages_master.from_destination = from_destination_zone.id 
            ${customCondition}
            GROUP BY package_assets.package_id ORDER BY packages_master.id DESC`, (err, rows) => {
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

function getAllPackageTypesModel(condition) {
    const customCondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM package_types ${customCondition}`, (err, rows) => {
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

function createPackageModel(packageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO packages_master SET ?', packageData, (err, rows) => {
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

function createPackageAssetsModel(packageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO package_assets SET ?', packageData, (err, rows) => {
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

function getAllPackageAssetsModel(condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM package_assets ${customCondition} ORDER BY id DESC`, (err, rows) => {
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


function createPackageItinerariesModel(packageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO package_itineraries SET ?', packageData, (err, rows) => {
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

function getAllPackageItinerariesModel(condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM package_itineraries ${customCondition} ORDER BY id DESC`, (err, rows) => {
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


function createPackagePoliciesModel(packageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO package_policies SET ?', packageData, (err, rows) => {
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

function getAllPackagePoliciesModel(condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM package_policies ${customCondition} ORDER BY id DESC`, (err, rows) => {
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

function deletePackageModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM packages_master ${customcondition}`, (err, rows) => {
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

function deleteItinerariesModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM package_itineraries ${customcondition}`, (err, rows) => {
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

function deletePoliciesModel(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM package_policies ${customcondition}`, (err, rows) => {
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

function deleteAssets(condition) {
    const customcondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM package_assets ${customcondition}`, (err, rows) => {
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
    getParticulrPackageModel,
    createPackageModel,
    createPackageAssetsModel,
    setPackageModel,
    getAllPackageTypesModel,
    createPackageItinerariesModel,
    createPackagePoliciesModel,
    getAllPackageModel,
    getParticularPackageModel,
    getAllPackagePoliciesModel,
    getAllPackageItinerariesModel,
    getAllPackageAssetsModel,
    deleteItinerariesModel,
    deletePoliciesModel,
    deleteAssets,
    deletePackageModel
}