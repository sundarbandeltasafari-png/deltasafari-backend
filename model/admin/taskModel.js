const connection = require('../../Connection');

/**
 * Auto-initialize Task Management Tables
 */
function initTaskTables() {
    const createTasksTable = `
        CREATE TABLE IF NOT EXISTS crm_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_code VARCHAR(50) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            assigned_to INT NOT NULL,
            created_by INT NOT NULL,
            priority ENUM('urgent', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
            status ENUM('todo', 'in_progress', 'review', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
            category VARCHAR(100) NOT NULL DEFAULT 'General',
            due_date DATE NULL,
            due_time VARCHAR(20) NULL,
            checklists_json JSON NULL,
            lead_contact_id INT NULL,
            lead_name VARCHAR(255) NULL,
            lead_phone VARCHAR(50) NULL,
            completed_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_assigned_to (assigned_to),
            INDEX idx_created_by (created_by),
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_due_date (due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createActivitiesTable = `
        CREATE TABLE IF NOT EXISTS crm_task_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            activity_type ENUM('comment', 'status_change', 'reassign', 'checklist_update', 'created') NOT NULL DEFAULT 'comment',
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_id (task_id),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    connection.query(createTasksTable, (err) => {
        if (err) console.error('[TaskModel] Error creating crm_tasks table:', err);
    });

    connection.query(createActivitiesTable, (err) => {
        if (err) console.error('[TaskModel] Error creating crm_task_activities table:', err);
    });
}

// Auto-init on load
initTaskTables();

/**
 * Generate Next Task Code (e.g. TSK-1001, TSK-1002...)
 */
function getNextTaskCode() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT MAX(id) as max_id FROM crm_tasks`;
        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            const nextId = (rows && rows[0] && rows[0].max_id ? rows[0].max_id : 0) + 1;
            const code = `TSK-${String(1000 + nextId)}`;
            resolve(code);
        });
    });
}

/**
 * Get All Active Admin Users for Assignment
 */
function getAdminUsers(currentUser = {}) {
    return new Promise((resolve, reject) => {
        let sql = `
            SELECT id, first_name, last_name, email, phone, admin, status
            FROM user_master
            WHERE status = 1 AND (admin = 1 OR admin = 2)
        `;

        if (currentUser.admin !== 1 && currentUser.id) {
            // For regular admin users, return themselves
            sql += ` AND id = ${parseInt(currentUser.id)}`;
        }

        sql += ` ORDER BY admin ASC, first_name ASC`;

        connection.query(sql, (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Create a New Task
 */
async function createTask(data, creatorUserId, currentUser = {}) {
    const taskCode = await getNextTaskCode();
    return new Promise((resolve, reject) => {
        const insertSql = `
            INSERT INTO crm_tasks (
                task_code,
                title,
                description,
                assigned_to,
                created_by,
                priority,
                status,
                category,
                due_date,
                due_time,
                checklists_json,
                lead_contact_id,
                lead_name,
                lead_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const checklists = Array.isArray(data.checklists) ? JSON.stringify(data.checklists) : (data.checklists_json ? JSON.stringify(data.checklists_json) : null);
        
        // If regular admin user, they can only assign to themselves
        const assignedTo = currentUser.admin !== 1 ? creatorUserId : (data.assigned_to || creatorUserId);
        const priority = data.priority || 'medium';
        const status = data.status || 'todo';
        const category = data.category || 'General';
        const dueDate = data.due_date ? data.due_date : null;
        const dueTime = data.due_time ? data.due_time : null;

        connection.query(insertSql, [
            taskCode,
            data.title.trim(),
            data.description ? data.description.trim() : null,
            assignedTo,
            creatorUserId,
            priority,
            status,
            category,
            dueDate,
            dueTime,
            checklists,
            data.lead_contact_id || null,
            data.lead_name || null,
            data.lead_phone || null
        ], (err, result) => {
            if (err) return reject(err);
            const taskId = result.insertId;

            // Log activity
            const logSql = `INSERT INTO crm_task_activities (task_id, user_id, activity_type, content) VALUES (?, ?, 'created', ?)`;
            connection.query(logSql, [taskId, creatorUserId, `Task created and assigned.`]);

            resolve({ id: taskId, task_code: taskCode });
        });
    });
}

/**
 * Get Tasks with Filter & Strict User Privacy Isolation
 * Regular admin users ONLY see tasks assigned to them.
 * Super admins can see all tasks across the system.
 */
function getTasksList(filters = {}, currentUser = {}) {
    return new Promise((resolve, reject) => {
        let whereClauses = ['1=1'];
        let params = [];

        // STRICT PRIVACY ISOLATION:
        // Regular admin user (admin !== 1) can ONLY see tasks assigned to them!
        if (currentUser.admin !== 1 && currentUser.id) {
            whereClauses.push('t.assigned_to = ?');
            params.push(currentUser.id);
        } else {
            // Super Admin can filter by any assignee or view my_tasks_only
            if (filters.my_tasks_only === 'true' || filters.my_tasks_only === true) {
                whereClauses.push('(t.assigned_to = ? OR t.created_by = ?)');
                params.push(currentUser.id, currentUser.id);
            } else if (filters.assigned_to && filters.assigned_to !== 'all') {
                whereClauses.push('t.assigned_to = ?');
                params.push(parseInt(filters.assigned_to));
            }
        }

        if (filters.status && filters.status !== 'all') {
            whereClauses.push('t.status = ?');
            params.push(filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
            whereClauses.push('t.priority = ?');
            params.push(filters.priority);
        }

        if (filters.category && filters.category !== 'all') {
            whereClauses.push('t.category = ?');
            params.push(filters.category);
        }

        if (filters.search) {
            const searchTerm = `%${filters.search.trim()}%`;
            whereClauses.push('(t.title LIKE ? OR t.task_code LIKE ? OR t.lead_name LIKE ? OR t.lead_phone LIKE ?)');
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.from_date) {
            whereClauses.push('t.due_date >= ?');
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            whereClauses.push('t.due_date <= ?');
            params.push(filters.to_date);
        }

        const whereSql = whereClauses.join(' AND ');

        const sql = `
            SELECT 
                t.*,
                u_assign.first_name as assignee_first_name,
                u_assign.last_name as assignee_last_name,
                u_assign.email as assignee_email,
                u_assign.phone as assignee_phone,
                u_create.first_name as creator_first_name,
                u_create.last_name as creator_last_name
            FROM crm_tasks t
            LEFT JOIN user_master u_assign ON u_assign.id = t.assigned_to
            LEFT JOIN user_master u_create ON u_create.id = t.created_by
            WHERE ${whereSql}
            ORDER BY 
                CASE 
                    WHEN t.priority = 'urgent' THEN 1
                    WHEN t.priority = 'high' THEN 2
                    WHEN t.priority = 'medium' THEN 3
                    ELSE 4
                END ASC,
                COALESCE(t.due_date, '2099-12-31') ASC,
                t.id DESC
        `;

        connection.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            const tasks = JSON.parse(JSON.stringify(rows || [])).map(t => {
                try {
                    t.checklists = typeof t.checklists_json === 'string' ? JSON.parse(t.checklists_json) : (t.checklists_json || []);
                } catch (e) {
                    t.checklists = [];
                }
                return t;
            });
            resolve(tasks);
        });
    });
}

/**
 * Get Task Details with Activities (with Privacy Isolation)
 */
function getTaskById(taskId, currentUser = {}) {
    return new Promise((resolve, reject) => {
        let whereClauses = ['t.id = ?'];
        let params = [taskId];

        // Regular admin user can only view their own assigned task
        if (currentUser.admin !== 1 && currentUser.id) {
            whereClauses.push('t.assigned_to = ?');
            params.push(currentUser.id);
        }

        const sql = `
            SELECT 
                t.*,
                u_assign.first_name as assignee_first_name,
                u_assign.last_name as assignee_last_name,
                u_assign.email as assignee_email,
                u_assign.phone as assignee_phone,
                u_create.first_name as creator_first_name,
                u_create.last_name as creator_last_name
            FROM crm_tasks t
            LEFT JOIN user_master u_assign ON u_assign.id = t.assigned_to
            LEFT JOIN user_master u_create ON u_create.id = t.created_by
            WHERE ${whereClauses.join(' AND ')}
        `;

        connection.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            if (!rows || rows.length === 0) return resolve(null);
            const task = JSON.parse(JSON.stringify(rows[0]));
            try {
                task.checklists = typeof task.checklists_json === 'string' ? JSON.parse(task.checklists_json) : (task.checklists_json || []);
            } catch (e) {
                task.checklists = [];
            }
            resolve(task);
        });
    });
}

/**
 * Update Task Status (with Strict Privacy Isolation)
 */
function updateTaskStatus(taskId, status, userId, currentUser = {}) {
    return new Promise((resolve, reject) => {
        // Verify ownership
        const checkSql = `SELECT assigned_to, created_by FROM crm_tasks WHERE id = ?`;
        connection.query(checkSql, [taskId], (cErr, rows) => {
            if (cErr) return reject(cErr);
            if (!rows || rows.length === 0) return reject(new Error("Task not found."));

            const task = rows[0];
            if (currentUser.admin !== 1 && task.assigned_to !== currentUser.id) {
                return reject(new Error("Permission denied: You can only update tasks assigned to you."));
            }

            const completedAtSql = status === 'completed' ? ', completed_at = NOW()' : ', completed_at = NULL';
            const sql = `UPDATE crm_tasks SET status = ? ${completedAtSql} WHERE id = ?`;

            connection.query(sql, [status, taskId], (err, result) => {
                if (err) return reject(err);

                // Log activity
                const logSql = `INSERT INTO crm_task_activities (task_id, user_id, activity_type, content) VALUES (?, ?, 'status_change', ?)`;
                connection.query(logSql, [taskId, userId, `Status changed to ${status.toUpperCase().replace('_', ' ')}`]);

                resolve(result);
            });
        });
    });
}

/**
 * Update Full Task Details (with Strict Privacy Isolation)
 */
function updateTask(taskId, data, userId, currentUser = {}) {
    return new Promise((resolve, reject) => {
        // Verify ownership
        const checkSql = `SELECT assigned_to, created_by FROM crm_tasks WHERE id = ?`;
        connection.query(checkSql, [taskId], (cErr, rows) => {
            if (cErr) return reject(cErr);
            if (!rows || rows.length === 0) return reject(new Error("Task not found."));

            const task = rows[0];
            if (currentUser.admin !== 1 && task.assigned_to !== currentUser.id) {
                return reject(new Error("Permission denied: You can only edit tasks assigned to you."));
            }

            const checklists = Array.isArray(data.checklists) ? JSON.stringify(data.checklists) : (data.checklists_json ? JSON.stringify(data.checklists_json) : null);
            const completedAtSql = data.status === 'completed' ? ', completed_at = COALESCE(completed_at, NOW())' : (data.status ? ', completed_at = NULL' : '');

            // Regular admin user cannot reassign task to someone else
            const assignedToVal = currentUser.admin === 1 ? (data.assigned_to || null) : task.assigned_to;

            const updateSql = `
                UPDATE crm_tasks SET
                    title = COALESCE(?, title),
                    description = ?,
                    assigned_to = COALESCE(?, assigned_to),
                    priority = COALESCE(?, priority),
                    status = COALESCE(?, status),
                    category = COALESCE(?, category),
                    due_date = ?,
                    due_time = ?,
                    checklists_json = COALESCE(?, checklists_json),
                    lead_name = ?,
                    lead_phone = ?
                    ${completedAtSql}
                WHERE id = ?
            `;

            connection.query(updateSql, [
                data.title ? data.title.trim() : null,
                data.description !== undefined ? (data.description ? data.description.trim() : null) : null,
                assignedToVal,
                data.priority || null,
                data.status || null,
                data.category || null,
                data.due_date || null,
                data.due_time || null,
                checklists,
                data.lead_name || null,
                data.lead_phone || null,
                taskId
            ], (err, result) => {
                if (err) return reject(err);

                // Log activity
                const logSql = `INSERT INTO crm_task_activities (task_id, user_id, activity_type, content) VALUES (?, ?, 'comment', ?)`;
                connection.query(logSql, [taskId, userId, `Task details updated.`]);

                resolve(result);
            });
        });
    });
}

/**
 * Delete Task (with Permission Check)
 */
function deleteTask(taskId, currentUser = {}) {
    return new Promise((resolve, reject) => {
        const checkSql = `SELECT assigned_to, created_by FROM crm_tasks WHERE id = ?`;
        connection.query(checkSql, [taskId], (cErr, rows) => {
            if (cErr) return reject(cErr);
            if (!rows || rows.length === 0) return resolve(null);

            const task = rows[0];
            if (currentUser.admin !== 1 && task.created_by !== currentUser.id && task.assigned_to !== currentUser.id) {
                return reject(new Error("Permission denied: You cannot delete this task."));
            }

            connection.query(`DELETE FROM crm_task_activities WHERE task_id = ?`, [taskId], () => {
                connection.query(`DELETE FROM crm_tasks WHERE id = ?`, [taskId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        });
    });
}

/**
 * Add Task Comment / Note (with Permission Check)
 */
function addTaskComment(taskId, userId, content, currentUser = {}) {
    return new Promise((resolve, reject) => {
        const checkSql = `SELECT assigned_to, created_by FROM crm_tasks WHERE id = ?`;
        connection.query(checkSql, [taskId], (cErr, rows) => {
            if (cErr) return reject(cErr);
            if (!rows || rows.length === 0) return reject(new Error("Task not found."));

            const task = rows[0];
            if (currentUser.admin !== 1 && task.assigned_to !== currentUser.id) {
                return reject(new Error("Permission denied: You can only comment on your assigned tasks."));
            }

            const sql = `INSERT INTO crm_task_activities (task_id, user_id, activity_type, content) VALUES (?, ?, 'comment', ?)`;
            connection.query(sql, [taskId, userId, content.trim()], (err, result) => {
                if (err) return reject(err);
                resolve({ id: result.insertId });
            });
        });
    });
}

/**
 * Get Task Activities & Comments Log
 */
function getTaskActivities(taskId) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                a.*,
                u.first_name,
                u.last_name,
                u.email
            FROM crm_task_activities a
            LEFT JOIN user_master u ON u.id = a.user_id
            WHERE a.task_id = ?
            ORDER BY a.id ASC
        `;
        connection.query(sql, [taskId], (err, rows) => {
            if (err) return reject(err);
            resolve(JSON.parse(JSON.stringify(rows || [])));
        });
    });
}

/**
 * Get Task Management Stats (with Privacy Isolation)
 */
function getTaskStats(currentUser = {}) {
    return new Promise((resolve, reject) => {
        let whereClauses = ['1=1'];
        let params = [];

        if (currentUser.admin !== 1 && currentUser.id) {
            whereClauses.push('assigned_to = ?');
            params.push(currentUser.id);
        }

        const whereSql = whereClauses.join(' AND ');

        const sql = `
            SELECT
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_count,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status != 'completed' AND status != 'cancelled' AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_count,
                SUM(CASE WHEN status != 'completed' AND status != 'cancelled' AND due_date = CURDATE() THEN 1 ELSE 0 END) as due_today_count,
                SUM(CASE WHEN assigned_to = ? THEN 1 ELSE 0 END) as assigned_to_me_count,
                SUM(CASE WHEN priority = 'urgent' AND status != 'completed' THEN 1 ELSE 0 END) as urgent_count
            FROM crm_tasks
            WHERE ${whereSql}
        `;

        connection.query(sql, [currentUser.id || 0, ...params], (err, rows) => {
            if (err) return reject(err);
            const stats = rows && rows[0] ? rows[0] : {};
            resolve({
                total_tasks: parseInt(stats.total_tasks || 0),
                todo_count: parseInt(stats.todo_count || 0),
                in_progress_count: parseInt(stats.in_progress_count || 0),
                review_count: parseInt(stats.review_count || 0),
                completed_count: parseInt(stats.completed_count || 0),
                overdue_count: parseInt(stats.overdue_count || 0),
                due_today_count: parseInt(stats.due_today_count || 0),
                assigned_to_me_count: parseInt(stats.assigned_to_me_count || 0),
                urgent_count: parseInt(stats.urgent_count || 0)
            });
        });
    });
}

module.exports = {
    initTaskTables,
    getAdminUsers,
    createTask,
    getTasksList,
    getTaskById,
    updateTaskStatus,
    updateTask,
    deleteTask,
    addTaskComment,
    getTaskActivities,
    getTaskStats
};
