const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { getBookingUsersList } = require('../../controller/admin/bookingUsersController');

// Booking Users & History (Accessible to all admins & employees)
router.get('/', adminAuthMiddleWare, getBookingUsersList);

module.exports = router;
