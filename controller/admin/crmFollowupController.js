const asyncHandler = require('express-async-handler');
const {
    saveLeadFollowupModel,
    getFollowupsListModel,
    getFollowupStatsModel,
    getFollowupLogsHistoryModel,
    getSingleLeadFollowupModel
} = require('../../model/admin/crmFollowupModel');
const connection = require('../../Connection');

/**
 * Save / Update Lead Follow-up
 * POST /admin/crm/followups/save
 */
const saveLeadFollowup = asyncHandler(async (req, res, next) => {
    try {
        const {
            contact_id,
            lead_name,
            phone,
            email,
            lead_type,
            travel_date,
            travel_destination,
            number_of_persons,
            total_rooms,
            extra_note,
            next_followup_date
        } = req.body;

        if (!contact_id) {
            return res.status(400).json({ status: false, msg: 'Contact ID is required.' });
        }

        const isSuperAdmin = req.user?.admin === 1;
        const currentUserId = req.user?.id;

        // Verify assignment for regular staff admins
        if (!isSuperAdmin) {
            const contact = await new Promise((resolve) => {
                connection.query(`SELECT id, assigned_to FROM whatsapp_contacts WHERE id = ? LIMIT 1`, [contact_id], (err, rows) => {
                    resolve(rows && rows.length > 0 ? rows[0] : null);
                });
            });

            if (!contact) {
                return res.status(404).json({ status: false, msg: 'Contact not found.' });
            }

            if (contact.assigned_to !== currentUserId) {
                return res.status(403).json({ status: false, msg: 'Unauthorized: You can only manage follow-ups for leads assigned to you.' });
            }
        }

        const result = await saveLeadFollowupModel({
            contact_id: Number(contact_id),
            lead_name,
            phone,
            email,
            lead_type,
            travel_date,
            travel_destination,
            number_of_persons,
            total_rooms,
            extra_note,
            next_followup_date,
            admin_user_id: currentUserId
        });

        return res.status(200).json({
            status: true,
            msg: 'Follow-up saved successfully and audit log updated.',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get Paginated Follow-up Leads with Filters
 * GET /admin/crm/followups
 */
const getFollowupsList = asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const search = req.query.search || '';
        const lead_type = req.query.lead_type || '';
        const is_today_only = req.query.is_today_only === 'true' || req.query.today === 'true';
        const from_date = req.query.from_date || '';
        const to_date = req.query.to_date || '';
        const date_filter_type = req.query.date_filter_type || 'next_followup';
        const assigned_to = req.query.assigned_to || '';

        const result = await getFollowupsListModel({
            page,
            limit,
            search,
            lead_type,
            is_today_only,
            from_date,
            to_date,
            date_filter_type,
            assigned_to,
            requestingUser: req.user
        });

        return res.status(200).json({
            status: true,
            msg: 'Follow-up leads retrieved successfully.',
            ...result,
            is_super_admin: req.user?.admin === 1
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get Follow-up Summary Statistics
 * GET /admin/crm/followups/stats
 */
const getFollowupStats = asyncHandler(async (req, res, next) => {
    try {
        const stats = await getFollowupStatsModel(req.user);
        return res.status(200).json({
            status: true,
            msg: 'Follow-up statistics loaded.',
            stats,
            is_super_admin: req.user?.admin === 1
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get Single Lead Follow-up Details & History
 * GET /admin/crm/followups/contact/:contactId
 */
const getSingleLeadFollowup = asyncHandler(async (req, res, next) => {
    try {
        const contactId = Number(req.params.contactId);
        if (!contactId) {
            return res.status(400).json({ status: false, msg: 'Invalid Contact ID.' });
        }

        const data = await getSingleLeadFollowupModel(contactId, req.user);
        if (!data) {
            return res.status(404).json({ status: false, msg: 'Lead follow-up not found.' });
        }
        if (data.unauthorized) {
            return res.status(403).json({ status: false, msg: 'Unauthorized to view this lead.' });
        }

        return res.status(200).json({
            status: true,
            msg: 'Lead follow-up details loaded.',
            data
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Get Audit Logs History for a Lead
 * GET /admin/crm/followups/logs/:contactId
 */
const getFollowupLogs = asyncHandler(async (req, res, next) => {
    try {
        const contactId = Number(req.params.contactId);
        if (!contactId) {
            return res.status(400).json({ status: false, msg: 'Invalid Contact ID.' });
        }

        const data = await getFollowupLogsHistoryModel(contactId, req.user);
        if (!data) {
            return res.status(404).json({ status: false, msg: 'Lead not found.' });
        }
        if (data.unauthorized) {
            return res.status(403).json({ status: false, msg: 'Unauthorized: You can only view logs for leads assigned to you.' });
        }

        return res.status(200).json({
            status: true,
            msg: 'Follow-up history logs retrieved.',
            contact: data.contact,
            logs: data.logs
        });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    saveLeadFollowup,
    getFollowupsList,
    getFollowupStats,
    getSingleLeadFollowup,
    getFollowupLogs
};
