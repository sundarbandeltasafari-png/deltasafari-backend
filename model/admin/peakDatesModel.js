const connection = require('../../Connection');

/**
 * Auto-initialize CRM Peak Dates Table
 */
function initPeakDatesTable() {
    const createSql = `
        CREATE TABLE IF NOT EXISTS crm_peak_dates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            peak_type VARCHAR(50) DEFAULT 'peak',
            surge_percentage INT DEFAULT 0,
            color VARCHAR(50) DEFAULT '#dc2626',
            notes TEXT NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_start_date (start_date),
            INDEX idx_end_date (end_date),
            INDEX idx_peak_type (peak_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createSql, (err) => {
        if (err) console.error("[Peak Dates Model] Error initializing crm_peak_dates table:", err.message);
    });
}

initPeakDatesTable();

function formatDateForDb(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

/**
 * Get List of Peak Dates within an optional Date Range
 */
function getPeakDatesModel({ start_date = '', end_date = '', search = '' } = {}) {
    return new Promise((resolve, reject) => {
        let conditions = [];
        let params = [];

        const fStart = formatDateForDb(start_date);
        const fEnd = formatDateForDb(end_date);

        if (fStart && fEnd) {
            // Overlapping date range condition
            conditions.push(`(p.start_date <= ? AND p.end_date >= ?)`);
            params.push(fEnd, fStart);
        } else if (fStart) {
            conditions.push(`p.end_date >= ?`);
            params.push(fStart);
        } else if (fEnd) {
            conditions.push(`p.start_date <= ?`);
            params.push(fEnd);
        }

        if (search && search.trim() !== '') {
            conditions.push(`(p.title LIKE ? OR p.notes LIKE ?)`);
            params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const sql = `
            SELECT 
                p.id,
                p.title,
                DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
                p.peak_type,
                p.surge_percentage,
                p.color,
                p.notes,
                p.created_by,
                p.created_at,
                p.updated_at,
                CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
                u.email AS created_by_email
            FROM crm_peak_dates p
            LEFT JOIN user_master u ON u.id = p.created_by
            ${whereClause}
            ORDER BY p.start_date ASC
        `;

        connection.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows ? JSON.parse(JSON.stringify(rows)) : []);
        });
    });
}

/**
 * Create Peak Date or Date Range
 */
function createPeakDateModel({
    title,
    start_date,
    end_date,
    peak_type = 'peak',
    surge_percentage = 0,
    color = '#dc2626',
    notes = '',
    admin_user_id
}) {
    return new Promise((resolve, reject) => {
        if (!title || !title.trim()) {
            return reject(new Error("Peak Date Title is required."));
        }
        if (!start_date) {
            return reject(new Error("Start Date is required."));
        }

        const fStart = formatDateForDb(start_date);
        const fEnd = formatDateForDb(end_date) || fStart;

        if (!fStart) {
            return reject(new Error("Invalid Start Date."));
        }
        if (fEnd < fStart) {
            return reject(new Error("End Date cannot be earlier than Start Date."));
        }

        const insertSql = `
            INSERT INTO crm_peak_dates (
                title,
                start_date,
                end_date,
                peak_type,
                surge_percentage,
                color,
                notes,
                created_by,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        connection.query(insertSql, [
            title.trim(),
            fStart,
            fEnd,
            peak_type || 'peak',
            parseInt(surge_percentage) || 0,
            color || '#dc2626',
            notes ? notes.trim() : null,
            admin_user_id
        ], (err, result) => {
            if (err) return reject(err);
            resolve({
                id: result.insertId,
                title: title.trim(),
                start_date: fStart,
                end_date: fEnd,
                peak_type: peak_type || 'peak',
                surge_percentage: parseInt(surge_percentage) || 0,
                color: color || '#dc2626',
                notes
            });
        });
    });
}

/**
 * Update Peak Date
 */
function updatePeakDateModel(id, {
    title,
    start_date,
    end_date,
    peak_type = 'peak',
    surge_percentage = 0,
    color = '#dc2626',
    notes = ''
}) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error("Peak Date ID is required."));
        if (!title || !title.trim()) return reject(new Error("Title is required."));
        if (!start_date) return reject(new Error("Start Date is required."));

        const fStart = formatDateForDb(start_date);
        const fEnd = formatDateForDb(end_date) || fStart;

        if (!fStart) {
            return reject(new Error("Invalid Start Date."));
        }
        if (fEnd < fStart) {
            return reject(new Error("End Date cannot be earlier than Start Date."));
        }

        const updateSql = `
            UPDATE crm_peak_dates
            SET 
                title = ?,
                start_date = ?,
                end_date = ?,
                peak_type = ?,
                surge_percentage = ?,
                color = ?,
                notes = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        connection.query(updateSql, [
            title.trim(),
            fStart,
            fEnd,
            peak_type || 'peak',
            parseInt(surge_percentage) || 0,
            color || '#dc2626',
            notes ? notes.trim() : null,
            id
        ], (err, result) => {
            if (err) return reject(err);
            resolve({
                id,
                title: title.trim(),
                start_date: fStart,
                end_date: fEnd,
                peak_type,
                surge_percentage,
                color,
                notes
            });
        });
    });
}

/**
 * Delete Peak Date
 */
function deletePeakDateModel(id) {
    return new Promise((resolve, reject) => {
        if (!id) return reject(new Error("Peak Date ID is required."));

        const deleteSql = `DELETE FROM crm_peak_dates WHERE id = ?`;
        connection.query(deleteSql, [id], (err, result) => {
            if (err) return reject(err);
            resolve({ success: true, id });
        });
    });
}

module.exports = {
    initPeakDatesTable,
    getPeakDatesModel,
    createPeakDateModel,
    updatePeakDateModel,
    deletePeakDateModel
};
