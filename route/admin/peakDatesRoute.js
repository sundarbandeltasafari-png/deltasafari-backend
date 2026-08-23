const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getPeakDates,
    createPeakDate,
    updatePeakDate,
    deletePeakDate
} = require('../../controller/admin/peakDatesController');

router.get('/', adminAuthMiddleWare, getPeakDates);
router.post('/', adminAuthMiddleWare, createPeakDate);
router.put('/:id', adminAuthMiddleWare, updatePeakDate);
router.delete('/:id', adminAuthMiddleWare, deletePeakDate);

module.exports = router;
