const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { 
    getAllContactsModel,
    getAllCorporateLeadEnquiriesModel,
    getParticularCorporateLeadEnquiryModel,
    updateCorporateLeadEnquiryModel,
    getAdminDashboardStatsModel,
    getAllHolidayEnquiriesModel,
    getParticularHolidayEnquiryModel,
    updateHolidayEnquiryModel,
    getAllContactQueriesAdminModel,
    getParticularContactQueryAdminModel,
    updateContactQueryAdminModel,
    deleteContactQueryAdminModel
} = require('../../../model/admin/service/adminServiceModel');

// Contact list
const getAllContactList = asyncHandler(async (req, res) => {
    try {
        const contacts = await getAllContactsModel();
        return res.status(200).json({ status: true, msg: 'All Contacts.', contacts: contacts })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

// 2nd API: View all corporate lead enquiries for admin
const getAllCorporateLeadEnquiries = asyncHandler(async (req, res) => {
    try {
        const leads = await getAllCorporateLeadEnquiriesModel();
        return res.status(200).json({ status: true, msg: 'All corporate lead enquiries fetched successfully.', leads: leads })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

// 3rd API: View a particular corporate lead enquiry by ID
const getParticularCorporateLeadEnquiry = asyncHandler(async (req, res) => {
    try {
        const id = req?.query?.id || req?.body?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid corporate lead enquiry ID.' })
        }
        const lead = await getParticularCorporateLeadEnquiryModel(id);
        if (!lead || lead.length === 0) {
            return res.status(404).json({ status: false, msg: 'Corporate lead enquiry not found.' });
        }
        return res.status(200).json({ status: true, msg: 'Corporate lead enquiry fetched successfully.', lead: lead[0] })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

// 4th API: Edit or change status of a corporate lead enquiry
const updateCorporateLeadEnquiry = asyncHandler(async (req, res) => {
    try {
        const id = req?.body?.id || req?.query?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid corporate lead enquiry ID.' })
        }
        const existingLead = await getParticularCorporateLeadEnquiryModel(id);
        if (!existingLead || existingLead.length === 0) {
            return res.status(404).json({ status: false, msg: 'Corporate lead enquiry not found.' });
        }

        const updateData = { ...req.body };
        delete updateData.id;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: false, msg: 'Please enter details to update.' });
        }

        const result = await updateCorporateLeadEnquiryModel(updateData, id);
        return res.status(200).json({ status: true, msg: 'Corporate lead enquiry updated successfully.', result: result })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

// --- Holiday Enquiries (Admin APIs) ---

// 2nd API: List all holiday enquiries for admin
const getAllHolidayEnquiries = asyncHandler(async (req, res) => {
    try {
        const enquiries = await getAllHolidayEnquiriesModel();
        return res.status(200).json({ status: true, msg: 'All holiday enquiries fetched successfully.', enquiries: enquiries });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// 3rd API: View details of a particular holiday enquiry by ID
const getParticularHolidayEnquiry = asyncHandler(async (req, res) => {
    try {
        const id = req?.query?.id || req?.body?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid holiday enquiry ID.' });
        }
        const enquiry = await getParticularHolidayEnquiryModel(id);
        if (!enquiry || enquiry.length === 0) {
            return res.status(404).json({ status: false, msg: 'Holiday enquiry not found.' });
        }
        return res.status(200).json({ status: true, msg: 'Holiday enquiry fetched successfully.', enquiry: enquiry[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// 4th API: Edit or change status of a holiday enquiry
const updateHolidayEnquiry = asyncHandler(async (req, res) => {
    try {
        const id = req?.body?.id || req?.query?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid holiday enquiry ID.' });
        }
        const existingEnquiry = await getParticularHolidayEnquiryModel(id);
        if (!existingEnquiry || existingEnquiry.length === 0) {
            return res.status(404).json({ status: false, msg: 'Holiday enquiry not found.' });
        }

        const updateData = { ...req.body };
        delete updateData.id;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: false, msg: 'Please enter details to update.' });
        }

        const result = await updateHolidayEnquiryModel(updateData, id);
        return res.status(200).json({ status: true, msg: 'Holiday enquiry updated successfully.', result: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// Dashboard API: Overview metrics & recent activities
const getAdminDashboard = asyncHandler(async (req, res) => {
    try {
        const timeframe = req.query?.timeframe || req.body?.timeframe || '6m';
        const dashboardData = await getAdminDashboardStatsModel(timeframe);
        return res.status(200).json({
            status: true,
            message: 'Dashboard analytics retrieved successfully',
            msg: 'Dashboard analytics retrieved successfully',
            data: dashboardData
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// --- Contact Queries (Admin APIs) ---

// 1. Get all contact queries
const getAllContactQueriesAdmin = asyncHandler(async (req, res) => {
    try {
        const queries = await getAllContactQueriesAdminModel();
        return res.status(200).json({ status: true, msg: 'All contact queries fetched successfully.', data: queries });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// 2. Get a particular contact query by ID
const getParticularContactQueryAdmin = asyncHandler(async (req, res) => {
    try {
        const id = req?.query?.id || req?.body?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid contact query ID.' });
        }
        const query = await getParticularContactQueryAdminModel(id);
        if (!query || query.length === 0) {
            return res.status(404).json({ status: false, msg: 'Contact query not found.' });
        }
        return res.status(200).json({ status: true, msg: 'Contact query fetched successfully.', data: query[0] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// 3. Update contact query details/status (e.g. status: 'new' | 'read' | 'replied' | 'archived')
const updateContactQueryAdmin = asyncHandler(async (req, res) => {
    try {
        const id = req?.body?.id || req?.query?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid contact query ID.' });
        }
        const existingQuery = await getParticularContactQueryAdminModel(id);
        if (!existingQuery || existingQuery.length === 0) {
            return res.status(404).json({ status: false, msg: 'Contact query not found.' });
        }

        const updateData = { ...req.body };
        delete updateData.id;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: false, msg: 'Please enter details to update.' });
        }

        const result = await updateContactQueryAdminModel(updateData, id);
        return res.status(200).json({ status: true, msg: 'Contact query updated successfully.', result: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

// 4. Delete a contact query
const deleteContactQueryAdmin = asyncHandler(async (req, res) => {
    try {
        const id = req?.body?.id || req?.query?.id;
        if (!id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid contact query ID.' });
        }
        const existingQuery = await getParticularContactQueryAdminModel(id);
        if (!existingQuery || existingQuery.length === 0) {
            return res.status(404).json({ status: false, msg: 'Contact query not found.' });
        }

        const result = await deleteContactQueryAdminModel(id);
        return res.status(200).json({ status: true, msg: 'Contact query deleted successfully.', result: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

module.exports = {
    getAllContactList,
    getAllCorporateLeadEnquiries,
    getParticularCorporateLeadEnquiry,
    updateCorporateLeadEnquiry,
    getAllHolidayEnquiries,
    getParticularHolidayEnquiry,
    updateHolidayEnquiry,
    getAdminDashboard,
    getAllContactQueriesAdmin,
    getParticularContactQueryAdmin,
    updateContactQueryAdmin,
    deleteContactQueryAdmin
}