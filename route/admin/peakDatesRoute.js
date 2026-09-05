const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare, superAdminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getPeakDates,
    createPeakDate,
    updatePeakDate,
    deletePeakDate
} = require('../../controller/admin/peakDatesController');

router.route('/')
    .get(adminAuthMiddleWare, getPeakDates)
    .post(superAdminAuthMiddleWare, createPeakDate);

router.route('/:id')
    .get(adminAuthMiddleWare, getPeakDates)
    .put(superAdminAuthMiddleWare, updatePeakDate)
    .post(superAdminAuthMiddleWare, updatePeakDate)
    .patch(superAdminAuthMiddleWare, updatePeakDate)
    .delete(superAdminAuthMiddleWare, deletePeakDate);

module.exports = router;
