const asyncHandler = require('express-async-handler');
const {
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
} = require('../../model/admin/taskModel');

/**
 * @desc Get list of admin users for task assignment
 * @route GET /admin/crm/tasks/users
 */
const getAdminUsersListHandler = asyncHandler(async (req, res) => {
    try {
        const users = await getAdminUsers(req.user);
        res.status(200).json({ status: true, users });
    } catch (err) {
        console.error('[TaskController] getAdminUsersList error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching admin users.' });
    }
});

/**
 * @desc Get task KPI stats (isolated for regular admin users)
 * @route GET /admin/crm/tasks/stats
 */
const getTaskStatsHandler = asyncHandler(async (req, res) => {
    try {
        const stats = await getTaskStats(req.user);
        res.status(200).json({ status: true, stats });
    } catch (err) {
        console.error('[TaskController] getTaskStats error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching task stats.' });
    }
});

/**
 * @desc Get tasks list with filters (strictly isolated for regular admin users)
 * @route GET /admin/crm/tasks
 */
const getTasksListHandler = asyncHandler(async (req, res) => {
    try {
        const filters = {
            search: req.query.search || '',
            assigned_to: req.query.assigned_to || '',
            status: req.query.status || '',
            priority: req.query.priority || '',
            category: req.query.category || '',
            from_date: req.query.from_date || '',
            to_date: req.query.to_date || '',
            my_tasks_only: req.query.my_tasks_only || '',
            assigned_to_me: req.query.assigned_to_me || ''
        };

        const tasks = await getTasksList(filters, req.user);

        // Group tasks into Kanban columns
        const kanban = {
            todo: tasks.filter(t => t.status === 'todo'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            review: tasks.filter(t => t.status === 'review'),
            completed: tasks.filter(t => t.status === 'completed')
        };

        res.status(200).json({
            status: true,
            total_count: tasks.length,
            tasks,
            kanban
        });
    } catch (err) {
        console.error('[TaskController] getTasksList error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching tasks.' });
    }
});

/**
 * @desc Create a new task
 * @route POST /admin/crm/tasks
 */
const createTaskHandler = asyncHandler(async (req, res) => {
    try {
        const { title, description, assigned_to, priority, status, category, due_date, due_time, checklists, lead_contact_id, lead_name, lead_phone } = req.body;

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ status: false, msg: 'Task title is required.' });
        }

        const creatorUserId = req.user?.id || 1;
        const assignedUserId = assigned_to ? parseInt(assigned_to) : creatorUserId;
        const result = await createTask({
            title: title.trim(),
            description,
            assigned_to: assignedUserId,
            priority: priority || 'medium',
            status: status || 'todo',
            category: category || 'General',
            due_date: due_date || null,
            due_time: due_time || null,
            checklists: Array.isArray(checklists) ? checklists : [],
            lead_contact_id: lead_contact_id ? parseInt(lead_contact_id) : null,
            lead_name: lead_name || null,
            lead_phone: lead_phone || null
        }, creatorUserId, req.user);

        // Send targeted socket notification ONLY to assigned admin user
        try {
            const { sendTaskNotification } = require('../../socket/chatSocket');
            sendTaskNotification(assignedUserId, {
                id: result.id,
                title: title.trim(),
                priority: priority || 'medium',
                assigned_by_name: `${req.user.first_name || 'Super Admin'} ${req.user.last_name || ''}`.trim(),
                lead_name: lead_name || null
            });
        } catch (sErr) {
            console.error('[TaskController] Socket task notification failed:', sErr);
        }

        res.status(201).json({
            status: true,
            msg: `Task ${result.task_code} created successfully!`,
            task: result
        });
    } catch (err) {
        console.error('[TaskController] createTask error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error creating task.' });
    }
});

/**
 * @desc Get single task details with activity log (isolated for regular admin users)
 * @route GET /admin/crm/tasks/:id
 */
const getTaskDetailsHandler = asyncHandler(async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await getTaskById(taskId, req.user);
        if (!task) {
            return res.status(404).json({ status: false, msg: 'Task not found or access denied.' });
        }

        const activities = await getTaskActivities(taskId);
        res.status(200).json({ status: true, task, activities });
    } catch (err) {
        console.error('[TaskController] getTaskDetails error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching task details.' });
    }
});

/**
 * @desc Update task status (Kanban column shift / drag and drop with privacy check)
 * @route PATCH /admin/crm/tasks/:id/status
 */
const updateTaskStatusHandler = asyncHandler(async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: false, msg: 'Invalid task status.' });
        }

        const userId = req.user?.id || 1;
        await updateTaskStatus(taskId, status, userId, req.user);

        res.status(200).json({
            status: true,
            msg: `Task status updated to ${status.toUpperCase().replace('_', ' ')}.`
        });
    } catch (err) {
        console.error('[TaskController] updateTaskStatus error:', err);
        res.status(err.message?.includes('Permission denied') ? 403 : 500).json({ status: false, msg: err.message || 'Error updating status.' });
    }
});

/**
 * @desc Update full task details (with privacy check)
 * @route PUT /admin/crm/tasks/:id
 */
const updateTaskHandler = asyncHandler(async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const userId = req.user?.id || 1;

        await updateTask(taskId, req.body, userId, req.user);
        res.status(200).json({ status: true, msg: 'Task updated successfully.' });
    } catch (err) {
        console.error('[TaskController] updateTask error:', err);
        res.status(err.message?.includes('Permission denied') ? 403 : 500).json({ status: false, msg: err.message || 'Error updating task.' });
    }
});

/**
 * @desc Delete task (with privacy check)
 * @route DELETE /admin/crm/tasks/:id
 */
const deleteTaskHandler = asyncHandler(async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        await deleteTask(taskId, req.user);
        res.status(200).json({ status: true, msg: 'Task deleted successfully.' });
    } catch (err) {
        console.error('[TaskController] deleteTask error:', err);
        res.status(err.message?.includes('Permission denied') ? 403 : 500).json({ status: false, msg: err.message || 'Error deleting task.' });
    }
});

/**
 * @desc Add comment/note to task
 * @route POST /admin/crm/tasks/:id/comments
 */
const addTaskCommentHandler = asyncHandler(async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { comment } = req.body;

        if (!comment || typeof comment !== 'string' || !comment.trim()) {
            return res.status(400).json({ status: false, msg: 'Comment text is required.' });
        }

        const userId = req.user?.id || 1;
        const result = await addTaskComment(taskId, userId, comment.trim(), req.user);

        res.status(201).json({ status: true, msg: 'Comment posted.', activity: result });
    } catch (err) {
        console.error('[TaskController] addTaskComment error:', err);
        res.status(err.message?.includes('Permission denied') ? 403 : 500).json({ status: false, msg: err.message || 'Error adding comment.' });
    }
});

module.exports = {
    getAdminUsersListHandler,
    getTaskStatsHandler,
    getTasksListHandler,
    createTaskHandler,
    getTaskDetailsHandler,
    updateTaskStatusHandler,
    updateTaskHandler,
    deleteTaskHandler,
    addTaskCommentHandler
};
