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
    try {
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

        const fStart = (start_date || '').toString().trim().split('T')[0];
        const fEnd = (end_date || fStart).toString().trim().split('T')[0];

        if (fEnd < fStart) {
            return res.status(400).json({ status: false, msg: 'End date cannot be earlier than start date.' });
        }

        const currentUserId = req.user?.id || 1;

        const result = await createPeakDateModel({
            title: title.trim(),
            start_date: fStart,
            end_date: fEnd,
            peak_type: peak_type || 'peak',
            surge_percentage: parseInt(surge_percentage) || 0,
            color: color || '#dc2626',
            notes: notes ? notes.trim() : '',
            admin_user_id: currentUserId
        });

        res.status(201).json({
            status: true,
            data: result,
            msg: 'Peak date added successfully.'
        });
    } catch (err) {
        console.error('[PeakDatesController] createPeakDate error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error creating peak date.' });
    }
});

/**
 * @desc Update Peak Date
 * @route PUT /admin/crm/peak-dates/:id
 */
const updatePeakDate = asyncHandler(async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            title,
            start_date,
            end_date,
            peak_type,
            surge_percentage,
            color,
            notes
        } = req.body;

        if (!id) {
            return res.status(400).json({ status: false, msg: 'Valid peak date ID is required.' });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ status: false, msg: 'Peak date title is required.' });
        }
        if (!start_date) {
            return res.status(400).json({ status: false, msg: 'Start date is required.' });
        }

        const fStart = (start_date || '').toString().trim().split('T')[0];
        const fEnd = (end_date || fStart).toString().trim().split('T')[0];

        if (fEnd < fStart) {
            return res.status(400).json({ status: false, msg: 'End date cannot be earlier than start date.' });
        }

        const result = await updatePeakDateModel(id, {
            title: title.trim(),
            start_date: fStart,
            end_date: fEnd,
            peak_type: peak_type || 'peak',
            surge_percentage: parseInt(surge_percentage) || 0,
            color: color || '#dc2626',
            notes: notes ? notes.trim() : ''
        });

        res.status(200).json({
            status: true,
            data: result,
            msg: 'Peak date updated successfully.'
        });
    } catch (err) {
        console.error('[PeakDatesController] updatePeakDate error:', err);
        res.status(500).json({ status: false, msg: err.message || 'Error updating peak date.' });
    }
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
