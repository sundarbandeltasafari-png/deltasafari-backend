const connection = require('../../Connection');
const md5 = require('md5');
const { buildCondition } = require('../../helper/modelHelper');


function getAllPackageTypesModel(condition) {
    const customCondition = buildCondition(condition)
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM package_types ${customCondition ? customCondition+ ' OR visible = 3' : customCondition}`, (err, rows) => {
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

function getCitiesModel(condition){
   const customcondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM cities ${customcondition} ORDER BY RAND() LIMIT 6`, (err, rows) => {
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

function getAllCitiesModel(condition){
    const customcondition = condition && Object.keys(condition).length > 0 ? buildCondition(condition) : '';
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM cities ${customcondition} ORDER BY id DESC`, (err, rows) => {
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
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getBookingByIdModel(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT bookings.*, bookings.id as bookings_id, 
            packages_master.title as package_title, packages_master.title, packages_master.slug, 
            packages_master.duration_days, packages_master.duration_nights, packages_master.package_type,
            packages_master.actual_price as package_price, packages_master.inclusions, packages_master.exclusions,
            to_destination_zone.name as to_destination_name, from_destination_zone.name as from_destination_name,
            user_master.first_name, user_master.last_name, user_master.email as user_account_email, user_master.phone as user_account_phone
        FROM bookings 
        LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
        LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
        LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
        LEFT JOIN user_master ON user_master.id = bookings.user_id 
        WHERE bookings.id = ? 
        LIMIT 1`;

        connection.query(sql, [id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows && rows.length > 0) {
                resolve(JSON.parse(JSON.stringify(rows[0])));
            } else {
                resolve(null);
            }
        });
    });
}

function getBookingByRazorpayOrderIdModel(orderId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT bookings.*, bookings.id as bookings_id, 
            packages_master.title as package_title, packages_master.title, packages_master.slug, 
            packages_master.duration_days, packages_master.duration_nights, packages_master.package_type,
            packages_master.actual_price as package_price, packages_master.inclusions, packages_master.exclusions,
            to_destination_zone.name as to_destination_name, from_destination_zone.name as from_destination_name,
            user_master.first_name, user_master.last_name, user_master.email as user_account_email, user_master.phone as user_account_phone
        FROM bookings 
        LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
        LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
        LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
        LEFT JOIN user_master ON user_master.id = bookings.user_id 
        WHERE bookings.razorpay_order_id = ? 
        LIMIT 1`;

        connection.query(sql, [orderId], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows && rows.length > 0) {
                resolve(JSON.parse(JSON.stringify(rows[0])));
            } else {
                resolve(null);
            }
        });
    });
}

function updateBookingModel(details, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE bookings SET ? WHERE id = ?', [details, id], (err, rows) => {
            if (err) {
                reject(new Error("Something went wrong in database!" + err?.message));
            }
            if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
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

function searchAllModel(searchTerm) {
    return new Promise((resolve, reject) => {
        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            return resolve([]);
        }
        const searchPattern = `%${searchTerm.trim()}%`;

        const citiesQuery = new Promise((res, rej) => {
            const sql = `SELECT *, 'city' AS type FROM cities WHERE name LIKE ? OR slug LIKE ? ORDER BY id DESC`;
            connection.query(sql, [searchPattern, searchPattern], (err, rows) => {
                if (err) return rej(err);
                const results = rows ? JSON.parse(JSON.stringify(rows)).map(item => ({ ...item, type: 'city' })) : [];
                res(results);
            });
        });

        const zonesQuery = new Promise((res, rej) => {
            const sql = `SELECT *, 'zone' AS type FROM zone WHERE name LIKE ? OR slug LIKE ? ORDER BY id DESC`;
            connection.query(sql, [searchPattern, searchPattern], (err, rows) => {
                if (err) return rej(err);
                const results = rows ? JSON.parse(JSON.stringify(rows)).map(item => ({ ...item, type: 'zone' })) : [];
                res(results);
            });
        });

        const packagesQuery = new Promise((res, rej) => {
            const sql = `SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, 
                               package_types.name as package_type_name, 
                               to_destination_zone.name as to_destination_name, 
                               from_destination_zone.name as from_destination_name,
                               'package' AS type 
                        FROM packages_master 
                        LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
                        LEFT JOIN package_types ON packages_master.package_type = package_types.id 
                        LEFT JOIN cities ON packages_master.city = cities.id 
                        LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
                        LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
                        WHERE packages_master.title LIKE ? OR packages_master.slug LIKE ? OR cities.name LIKE ? OR to_destination_zone.name LIKE ?
                        GROUP BY packages_master.id 
                        ORDER BY packages_master.id DESC`;
            connection.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern], (err, rows) => {
                if (err) return rej(err);
                const results = rows ? JSON.parse(JSON.stringify(rows)).map(item => ({ ...item, type: 'package' })) : [];
                res(results);
            });
        });

        Promise.all([citiesQuery, zonesQuery, packagesQuery])
            .then(([cities, zones, packages]) => {
                const combined = [...cities, ...zones, ...packages];
                resolve(combined);
            })
            .catch(err => {
                reject(new Error("Something went wrong in search: " + err?.message));
            });
    });
}


function getDiscountedPackagesModel(limit = 6) {
    const parsedLimit = Number(limit) || 6;
    return new Promise((resolve, reject) => {
        const sql = `SELECT packages_master.*, package_assets.path, package_assets.type as asset_type, 
                           package_types.name as package_type_name, 
                           to_destination_zone.name as to_destination_name, 
                           to_destination_zone.slug as to_destination_slug, 
                           from_destination_zone.name as from_destination_name, 
                           from_destination_zone.slug as from_destination_slug,
                           CASE 
                               WHEN packages_master.discount IS NOT NULL AND packages_master.discount > 0 THEN packages_master.discount
                               WHEN packages_master.base_price IS NOT NULL AND packages_master.base_price > packages_master.actual_price 
                                   THEN ROUND(((packages_master.base_price - packages_master.actual_price) / packages_master.base_price) * 100)
                               ELSE 20
                           END AS discount_percent
                    FROM packages_master 
                    LEFT JOIN package_assets ON packages_master.id = package_assets.package_id 
                    LEFT JOIN package_types ON packages_master.package_type = package_types.id 
                    LEFT JOIN cities ON packages_master.city = cities.id 
                    LEFT JOIN zone AS to_destination_zone ON packages_master.to_destination = to_destination_zone.id 
                    LEFT JOIN zone AS from_destination_zone ON packages_master.from_destination = from_destination_zone.id 
                    WHERE (package_assets.type = 1 OR package_assets.type IS NULL) 
                      AND packages_master.actual_price IS NOT NULL AND packages_master.actual_price > 0
                    GROUP BY packages_master.id 
                    ORDER BY discount_percent DESC, packages_master.id DESC 
                    LIMIT ${parsedLimit}`;

        connection.query(sql, (err, rows) => {
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
    getBookingByIdModel,
    getBookingByRazorpayOrderIdModel,
    updateBookingModel,
    getFilteredPackagesModel,
    getCitiesModel,
    getAllCitiesModel,
    getAllPackageTypesModel,
    searchAllModel,
    getDiscountedPackagesModel
}