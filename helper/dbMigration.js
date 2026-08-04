const connection = require('../Connection');

function ensureUserMasterColumns() {
    return new Promise((resolve) => {
        const columnsToAdd = [
            { name: 'user_type', type: 'INT DEFAULT 1' },
            { name: 'google_id', type: 'VARCHAR(255) DEFAULT ""' },
            { name: 'gender', type: 'VARCHAR(50) DEFAULT ""' },
            { name: 'address', type: 'TEXT DEFAULT NULL' },
            { name: 'city', type: 'VARCHAR(255) DEFAULT ""' },
            { name: 'profile_pic', type: 'VARCHAR(500) DEFAULT ""' }
        ];

        connection.query("SHOW COLUMNS FROM user_master", (err, rows) => {
            if (err) {
                console.log("Could not inspect user_master columns:", err.message);
                return resolve();
            }

            const existingColumns = rows ? rows.map(r => r.Field) : [];

            const alterTasks = columnsToAdd
                .filter(col => !existingColumns.includes(col.name))
                .map(col => {
                    return new Promise((resCol) => {
                        const sql = `ALTER TABLE user_master ADD COLUMN ${col.name} ${col.type}`;
                        connection.query(sql, (alterErr) => {
                            if (alterErr) {
                                console.error(`Error adding column ${col.name}:`, alterErr.message);
                            } else {
                                console.log(`DB Migration: Successfully added column "${col.name}" to user_master.`);
                            }
                            resCol();
                        });
                    });
                });

            Promise.all(alterTasks).then(() => resolve()).catch(() => resolve());
        });
    });
}

module.exports = { ensureUserMasterColumns };
