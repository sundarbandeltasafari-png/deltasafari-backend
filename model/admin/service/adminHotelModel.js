const connection = require('../../../Connection');
const { buildCondition } = require('../../../helper/modelHelper');

function getAllHotelsModel(condition) {
    const customCondition = condition && Object.keys(condition).length > 0 ? buildCondition(condition) : '';
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT hotels_master.*, 
                   COUNT(package_reference_hotels.package_id) AS linked_packages_count
            FROM hotels_master
            LEFT JOIN package_reference_hotels ON hotels_master.id = package_reference_hotels.hotel_id
            ${customCondition}
            GROUP BY hotels_master.id
            ORDER BY hotels_master.id DESC
        `;
        connection.query(sql, (err, rows) => {
            if (err) {
                reject(new Error("Database error while fetching hotels: " + err?.message));
            } else if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function getParticularHotelModel(condition) {
    const newCondition = condition && Object.entries(condition).map(([key, value]) => ({ [`hotels_master.${key}`]: value }));
    const customCondition = condition && buildCondition(Object.assign({}, ...newCondition));
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM hotels_master ${customCondition} ORDER BY id DESC LIMIT 1`, (err, rows) => {
            if (err) {
                reject(new Error("Database error while fetching hotel: " + err?.message));
            } else if (rows && rows.length > 0) {
                const hotel = JSON.parse(JSON.stringify(rows[0]));
                // Fetch linked packages
                connection.query(`
                    SELECT packages_master.id, packages_master.title, packages_master.slug, packages_master.actual_price, packages_master.duration_days, packages_master.duration_nights
                    FROM packages_master
                    INNER JOIN package_reference_hotels ON packages_master.id = package_reference_hotels.package_id
                    WHERE package_reference_hotels.hotel_id = ?
                    ORDER BY packages_master.id DESC
                `, [hotel.id], (pErr, pRows) => {
                    if (!pErr && pRows) {
                        hotel.packages = JSON.parse(JSON.stringify(pRows));
                        hotel.package_ids = hotel.packages.map(p => p.id);
                    } else {
                        hotel.packages = [];
                        hotel.package_ids = [];
                    }
                    resolve(hotel);
                });
            } else {
                resolve(null);
            }
        });
    });
}

function createHotelModel(hotelData) {
    return new Promise((resolve, reject) => {
        connection.query('INSERT INTO hotels_master SET ?', hotelData, (err, rows) => {
            if (err) {
                reject(new Error("Database error while creating hotel: " + err?.message));
            } else if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function updateHotelModel(hotelData, condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`UPDATE hotels_master SET ? ${customCondition}`, [hotelData], (err, rows) => {
            if (err) {
                reject(new Error("Database error while updating hotel: " + err?.message));
            } else if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function deleteHotelModel(condition) {
    const customCondition = buildCondition(condition);
    return new Promise((resolve, reject) => {
        connection.query(`DELETE FROM hotels_master ${customCondition}`, (err, rows) => {
            if (err) {
                reject(new Error("Database error while deleting hotel: " + err?.message));
            } else if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function linkHotelToPackages(hotelId, packageIds) {
    return new Promise((resolve, reject) => {
        if (!hotelId) return resolve(false);

        connection.query(`DELETE FROM package_reference_hotels WHERE hotel_id = ?`, [hotelId], (delErr) => {
            if (delErr) {
                console.error("Error clearing existing package links for hotel:", delErr.message);
            }

            if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
                return resolve(true);
            }

            const values = packageIds.map(pkgId => [pkgId, hotelId]);
            connection.query(`INSERT IGNORE INTO package_reference_hotels (package_id, hotel_id) VALUES ?`, [values], (insErr) => {
                if (insErr) {
                    console.error("Error linking hotel to packages:", insErr.message);
                    return reject(insErr);
                }
                resolve(true);
            });
        });
    });
}

function getPackageReferenceHotelsModel(packageId) {
    return new Promise((resolve, reject) => {
        if (!packageId) return resolve([]);

        const sql = `
            SELECT hotels_master.* 
            FROM hotels_master
            INNER JOIN package_reference_hotels ON hotels_master.id = package_reference_hotels.hotel_id
            WHERE package_reference_hotels.package_id = ? AND hotels_master.status = 1
            ORDER BY hotels_master.id DESC
        `;
        connection.query(sql, [packageId], (err, rows) => {
            if (err) {
                console.error("Error fetching package reference hotels:", err.message);
                resolve([]);
            } else if (rows) {
                resolve(JSON.parse(JSON.stringify(rows)));
            } else {
                resolve([]);
            }
        });
    });
}

function linkPackageToHotels(packageId, hotelIds) {
    return new Promise((resolve, reject) => {
        if (!packageId) return resolve(false);

        connection.query(`DELETE FROM package_reference_hotels WHERE package_id = ?`, [packageId], (delErr) => {
            if (delErr) {
                console.error("Error clearing existing hotel links for package:", delErr.message);
            }

            if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
                return resolve(true);
            }

            const values = hotelIds.map(hId => [packageId, hId]);
            connection.query(`INSERT IGNORE INTO package_reference_hotels (package_id, hotel_id) VALUES ?`, [values], (insErr) => {
                if (insErr) {
                    console.error("Error linking package to hotels:", insErr.message);
                    return reject(insErr);
                }
                resolve(true);
            });
        });
    });
}

function checkDuplicateHotelSlug(slug, excludeId = null, name = null) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id, name, slug FROM hotels_master WHERE (slug = ? OR name = ?)';
        const queryParams = [slug, name || slug];

        if (excludeId) {
            query += ' AND id != ?';
            queryParams.push(excludeId);
        }

        connection.query(query, queryParams, (err, rows) => {
            if (err) {
                reject(new Error("Database error while checking duplicate hotel: " + err?.message));
            } else if (rows && rows.length > 0) {
                resolve(JSON.parse(JSON.stringify(rows[0])));
            } else {
                resolve(null);
            }
        });
    });
}

module.exports = {
    getAllHotelsModel,
    getParticularHotelModel,
    createHotelModel,
    updateHotelModel,
    deleteHotelModel,
    linkHotelToPackages,
    getPackageReferenceHotelsModel,
    linkPackageToHotels,
    checkDuplicateHotelSlug
};
