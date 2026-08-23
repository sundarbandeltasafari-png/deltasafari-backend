const asyncHandler = require('express-async-handler');
const {
    getPeakDatesModel,
    createPeakDateModel,
    updatePeakDateModel,
    deletePeakDateModel
} = require('../../model/admin/peakDatesModel');

/**
 * @desc Get Peak Dates
 * @route GET /admin/crm/peak-dates
 */
const getPeakDates = asyncHandler(async (req, res) => {
    const { start_date = '', end_date = '', search = '' } = req.query;

    const data = await getPeakDatesModel({
        start_date,
        end_date,
        search
    });

    res.status(200).json({
        status: true,
        data,
        msg: 'Peak dates retrieved successfully.'
    });
});

/**
 * @desc Create Peak Date
 * @route POST /admin/crm/peak-dates
 */
const createPeakDate = asyncHandler(async (req, res) => {
    const {
        title,
        start_date,
        end_date,
        peak_type,
        surge_percentage,
        color,
        notes
    } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ status: false, msg: 'Peak date title is required.' });
    }
    if (!start_date) {
        return res.status(400).json({ status: false, msg: 'Start date is required.' });
    }
    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({ status: false, msg: 'End date cannot be earlier than start date.' });
    }

    const currentUserId = req.user?.id || 1;

    const result = await createPeakDateModel({
        title,
        start_date,
        end_date: end_date || start_date,
        peak_type,
        surge_percentage,
        color,
        notes,
        admin_user_id: currentUserId
    });

    res.status(201).json({
        status: true,
        data: result,
        msg: 'Peak date added successfully.'
    });
});

/**
 * @desc Update Peak Date
 * @route PUT /admin/crm/peak-dates/:id
 */
const updatePeakDate = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const {
        title,
        start_date,
        end_date,
        peak_type,
        surge_percentage,
        color,
        notes
    } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ status: false, msg: 'Peak date title is required.' });
    }
    if (!start_date) {
        return res.status(400).json({ status: false, msg: 'Start date is required.' });
    }
    if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({ status: false, msg: 'End date cannot be earlier than start date.' });
    }

    const result = await updatePeakDateModel(id, {
        title,
        start_date,
        end_date: end_date || start_date,
        peak_type,
        surge_percentage,
        color,
        notes
    });

    res.status(200).json({
        status: true,
        data: result,
        msg: 'Peak date updated successfully.'
    });
});

/**
 * @desc Delete Peak Date
 * @route DELETE /admin/crm/peak-dates/:id
 */
const deletePeakDate = asyncHandler(async (req, res) => {
    const id = req.params.id;

    await deletePeakDateModel(id);

    res.status(200).json({
        status: true,
        msg: 'Peak date removed successfully.'
    });
});

module.exports = {
    getPeakDates,
    createPeakDate,
    updatePeakDate,
    deletePeakDate
};
