const asyncHandler = require('express-async-handler');
const {
    createNotice,
    getNoticesList,
    getNoticeById,
    updateNotice,
    togglePinNotice,
    deleteNotice,
    getNoticeStats
} = require('../../model/admin/noticeModel');

/**
 * @desc Get all notices for admin users
 * @route GET /admin/crm/notices
 */
const getNoticesListHandler = asyncHandler(async (req, res) => {
    try {
        const filters = {
            search: req.query.search || '',
            notice_type: req.query.notice_type || '',
            category: req.query.category || '',
            is_pinned: req.query.is_pinned !== undefined ? req.query.is_pinned : '',
            include_expired: req.query.include_expired || 'false'
        };

        const notices = await getNoticesList(filters, req.user);
        res.status(200).json({
            status: true,
            total_count: notices.length,
            notices
        });
    } catch (err) {
        console.error('[NoticeController] getNoticesList error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching notices.' });
    }
});

/**
 * @desc Get notice board KPI stats
 * @route GET /admin/crm/notices/stats
 */
const getNoticeStatsHandler = asyncHandler(async (req, res) => {
    try {
        const stats = await getNoticeStats(req.user);
        res.status(200).json({ status: true, stats });
    } catch (err) {
        console.error('[NoticeController] getNoticeStats error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching notice stats.' });
    }
});

/**
 * @desc Get single notice details and mark as read
 * @route GET /admin/crm/notices/:id
 */
const getNoticeDetailsHandler = asyncHandler(async (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);
        const notice = await getNoticeById(noticeId, req.user);
        if (!notice) {
            return res.status(404).json({ status: false, msg: 'Notice not found.' });
        }
        res.status(200).json({ status: true, notice });
    } catch (err) {
        console.error('[NoticeController] getNoticeDetails error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error fetching notice details.' });
    }
});

/**
 * @desc Create notice (Super Admin only)
 * @route POST /admin/crm/notices
 */
const createNoticeHandler = asyncHandler(async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Only Super Administrators can publish official notices.' });
        }

        const { title, content, notice_type, category, is_pinned, is_active, expires_at, attachment_url } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ status: false, msg: 'Notice title is required.' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ status: false, msg: 'Notice content is required.' });
        }

        const result = await createNotice({
            title: title.trim(),
            content: content.trim(),
            notice_type: notice_type || 'general',
            category: category || 'General',
            is_pinned: !!is_pinned,
            is_active: is_active !== undefined ? !!is_active : true,
            expires_at: expires_at || null,
            attachment_url: attachment_url || null
        }, req.user.id);

        // Broadcast real-time socket notification to ALL admin users
        try {
            const { broadcastNoticeNotification } = require('../../socket/chatSocket');
            broadcastNoticeNotification({
                id: result.id,
                title: title.trim(),
                notice_type: notice_type || 'general',
                category: category || 'General',
                created_by_name: `${req.user.first_name || 'Super Admin'} ${req.user.last_name || ''}`.trim()
            });
        } catch (sErr) {
            console.error('[NoticeController] Socket notification broadcast failed:', sErr);
        }

        res.status(201).json({
            status: true,
            msg: 'Official notice published successfully to all admin users!',
            notice: result
        });
    } catch (err) {
        console.error('[NoticeController] createNotice error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error publishing notice.' });
    }
});

/**
 * @desc Update notice (Super Admin only)
 * @route PUT /admin/crm/notices/:id
 */
const updateNoticeHandler = asyncHandler(async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Only Super Administrators can edit notices.' });
        }

        const noticeId = parseInt(req.params.id);
        await updateNotice(noticeId, req.body);

        res.status(200).json({ status: true, msg: 'Notice updated successfully.' });
    } catch (err) {
        console.error('[NoticeController] updateNotice error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error updating notice.' });
    }
});

/**
 * @desc Toggle Pin Notice (Super Admin only)
 * @route PATCH /admin/crm/notices/:id/pin
 */
const togglePinNoticeHandler = asyncHandler(async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Only Super Administrators can pin/unpin notices.' });
        }

        const noticeId = parseInt(req.params.id);
        const { is_pinned } = req.body;

        await togglePinNotice(noticeId, is_pinned);

        res.status(200).json({
            status: true,
            msg: is_pinned ? 'Notice pinned to the top!' : 'Notice unpinned.'
        });
    } catch (err) {
        console.error('[NoticeController] togglePinNotice error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error toggling pin status.' });
    }
});

/**
 * @desc Delete notice (Super Admin only)
 * @route DELETE /admin/crm/notices/:id
 */
const deleteNoticeHandler = asyncHandler(async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Only Super Administrators can delete notices.' });
        }

        const noticeId = parseInt(req.params.id);
        await deleteNotice(noticeId);

        res.status(200).json({ status: true, msg: 'Notice deleted successfully.' });
    } catch (err) {
        console.error('[NoticeController] deleteNotice error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error deleting notice.' });
    }
});

module.exports = {
    getNoticesListHandler,
    getNoticeStatsHandler,
    getNoticeDetailsHandler,
    createNoticeHandler,
    updateNoticeHandler,
    togglePinNoticeHandler,
    deleteNoticeHandler
};
