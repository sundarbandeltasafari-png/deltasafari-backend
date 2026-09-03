const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getPeakDates,
    createPeakDate,
    updatePeakDate,
    deletePeakDate
} = require('../../controller/admin/peakDatesController');

router.route('/')
    .get(adminAuthMiddleWare, getPeakDates)
    .post(adminAuthMiddleWare, createPeakDate);

router.route('/:id')
    .get(adminAuthMiddleWare, getPeakDates)
    .put(adminAuthMiddleWare, updatePeakDate)
    .post(adminAuthMiddleWare, updatePeakDate)
    .patch(adminAuthMiddleWare, updatePeakDate)
    .delete(adminAuthMiddleWare, deletePeakDate);

module.exports = router;
