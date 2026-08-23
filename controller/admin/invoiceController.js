const asyncHandler = require('express-async-handler');
const {
    getInvoiceConfigModel,
    updateInvoiceConfigModel,
    getNextInvoiceNumberModel,
    createInvoiceModel,
    getInvoicesListModel,
    getInvoiceDetailsModel,
    deleteInvoiceModel,
    getBillingStatsModel
} = require('../../model/admin/invoiceModel');

/**
 * @desc Get Invoice Configuration
 * @route GET /admin/crm/invoices/config
 */
const getInvoiceConfig = asyncHandler(async (req, res) => {
    const config = await getInvoiceConfigModel();
    res.status(200).json({
        status: true,
        data: config,
        msg: 'Invoice configuration fetched.'
    });
});

/**
 * @desc Update Invoice Configuration
 * @route POST /admin/crm/invoices/config
 */
const updateInvoiceConfig = asyncHandler(async (req, res) => {
    const result = await updateInvoiceConfigModel(req.body);
    res.status(200).json({
        status: true,
        data: result,
        msg: 'Invoice configuration updated successfully.'
    });
});

/**
 * @desc Get Next Invoice Number
 * @route GET /admin/crm/invoices/next-number
 */
const getNextInvoiceNumber = asyncHandler(async (req, res) => {
    const data = await getNextInvoiceNumberModel();
    res.status(200).json({
        status: true,
        data,
        msg: 'Next invoice number generated.'
    });
});

/**
 * @desc Create New Invoice
 * @route POST /admin/crm/invoices
 */
const createInvoice = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id || 1;
    const result = await createInvoiceModel(req.body, currentUserId);
    res.status(201).json({
        status: true,
        data: result,
        msg: '🎉 Invoice created successfully.'
    });
});

/**
 * @desc Get Invoices List
 * @route GET /admin/crm/invoices
 */
const getInvoicesList = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        payment_status = '',
        from_date = '',
        to_date = ''
    } = req.query;

    const data = await getInvoicesListModel({
        page,
        limit,
        search,
        payment_status,
        from_date,
        to_date
    });

    res.status(200).json({
        status: true,
        ...data,
        msg: 'Invoices fetched successfully.'
    });
});

/**
 * @desc Get Single Invoice Details
 * @route GET /admin/crm/invoices/:id
 */
const getInvoiceDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await getInvoiceDetailsModel(id);

    if (!data) {
        return res.status(404).json({ status: false, msg: 'Invoice not found.' });
    }

    res.status(200).json({
        status: true,
        data,
        msg: 'Invoice details fetched.'
    });
});

/**
 * @desc Delete Invoice
 * @route DELETE /admin/crm/invoices/:id
 */
const deleteInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await deleteInvoiceModel(id);

    res.status(200).json({
        status: true,
        msg: 'Invoice removed successfully.'
    });
});

/**
 * @desc Get Billing Stats
 * @route GET /admin/crm/invoices/stats
 */
const getBillingStats = asyncHandler(async (req, res) => {
    const stats = await getBillingStatsModel();
    res.status(200).json({
        status: true,
        stats,
        msg: 'Billing stats retrieved.'
    });
});

module.exports = {
    getInvoiceConfig,
    updateInvoiceConfig,
    getNextInvoiceNumber,
    createInvoice,
    getInvoicesList,
    getInvoiceDetails,
    deleteInvoice,
    getBillingStats
};
