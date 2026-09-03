const asyncHandler = require('express-async-handler');
const { getBookingUsersListModel } = require('../../model/admin/bookingUsersModel');

/**
 * @desc Get All Booking Users with Aggregated Booking History
 * @route GET /admin/crm/booking-users
 */
const getBookingUsersList = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        payment_status = 'all'
    } = req.query;

    const result = await getBookingUsersListModel({
        page,
        limit,
        search,
        payment_status
    });

    res.status(200).json({
        status: true,
        data: result,
        msg: 'Booking users retrieved successfully.'
    });
});

module.exports = {
    getBookingUsersList
};
