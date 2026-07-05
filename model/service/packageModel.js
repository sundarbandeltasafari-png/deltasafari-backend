const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');

function getHomePackagesModel(condition, type = true) {
    const customcondition = condition ? (type ? "WHERE " : ' ') + Object.entries(condition)
        .map(([key, value]) => value == '' && value != 0 ? `packages_master.${key} IS NULL` : `packages_master.${key} = '${value}'`) // custom "=>" separator
        .join(" AND ") : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, 
                          package_types.name as package_type_name, 
                          to_destination_zone.name as to_destination_name, 
                          to_destination_zone.slug as to_destination_slug, 
                          from_destination_zone.name as from_destination_name,
                          from_destination_zone.slug as from_destination_slug 
                   FROM packages_master 
                   LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
                   LEFT JOIN package_types ON packages_master.package_type = package_types.id 
                   LEFT JOIN cities ON packages_master.city = cities.id 
                   LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
                   LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id ${customcondition} AND package_assets.type = 1 GROUP BY package_assets.package_id LIMIT 8`, (err, rows) => {
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

function getDestinationsModel(condition){
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

function createBookingsModel(packageData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO bookings SET ?', packageData, (err, rows) => {
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


function getFilteredPackagesModel(filters, limit = 5) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, 
                          package_types.name as package_type_name, 
                          to_destination_zone.name as to_destination_name, 
                          to_destination_zone.slug as to_destination_slug, 
                          from_destination_zone.name as from_destination_name, 
                          from_destination_zone.slug as from_destination_slug 
                   FROM packages_master 
                   LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
                   LEFT JOIN package_types ON packages_master.package_type = package_types.id 
                   LEFT JOIN cities ON packages_master.city = cities.id 
                   LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
                   LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id`;
        
        const conditions = [];
        const values = [];
        
        if (filters.destination) {
            // Using a Recursive CTE to grab the target zone and all its nested children
            const subQuery = `
                WITH RECURSIVE zone_hierarchy AS (
                    SELECT id FROM zone WHERE slug = ?
                    UNION ALL
                    SELECT z.id FROM zone z 
                    INNER JOIN zone_hierarchy zh ON z.parent_id = zh.id
                ) SELECT id FROM zone_hierarchy
            `;

            conditions.push(`(
                packages_master.to_destination IN (${subQuery}) OR 
                packages_master.from_destination IN (${subQuery})
            )`);
            
            // We pass filters.zone_id twice because the subquery runs for both 'to' and 'from' destinations
            values.push(filters.destination, filters.destination);
        }
        
        if (filters.name) {
            conditions.push(`packages_master.title LIKE ?`);
            values.push(`%${filters.name}%`);
        }
        
        if (filters.category) {
            if (!isNaN(filters.category)) {
                conditions.push(`packages_master.package_type = ?`);
                values.push(Number(filters.category));
            } else {
                conditions.push(`(package_types.name = ? OR package_types.slug = ?)`);
                values.push(filters.category, filters.category);
            }
        }

        if (filters.city) {
            if (!isNaN(filters.city)) {
                conditions.push(`packages_master.city = ?`);
                values.push(Number(filters.city));
            } else {
                conditions.push(`(cities.name = ? OR cities.slug = ?)`);
                values.push(filters.city, filters.city);
            }
        }


        if (filters.lastId) {
            conditions.push(`packages_master.id < ?`); 
            values.push(filters.lastId);
        }
        
        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }
        
        sql += ` GROUP BY packages_master.id ORDER BY packages_master.id DESC`;
        
        connection.query(sql, values, (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database! " + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}


module.exports = {
    getHomePackagesModel,
    getDestinationsModel,
    getParticularPackageModel,
    getAllPackagePoliciesModel,
    getAllPackageItinerariesModel,
    createBookingsModel,
    getFilteredPackagesModel
}