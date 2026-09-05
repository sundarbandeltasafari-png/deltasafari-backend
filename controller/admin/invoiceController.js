const asyncHandler = require('express-async-handler');
const {
    getInvoiceConfigModel,
    updateInvoiceConfigModel,
    getWhatsAppTemplatesModel,
    getWhatsAppTemplateByIdModel,
    createWhatsAppTemplateModel,
    updateWhatsAppTemplateModel,
    deleteWhatsAppTemplateModel,
    getNextInvoiceNumberModel,
    createInvoiceModel,
    getInvoicesListModel,
    getInvoiceDetailsModel,
    deleteInvoiceModel,
    getBillingStatsModel,
    sendInvoiceWhatsAppModel,
    generateInvoicePaymentLinkModel,
    updateInvoicePaymentStatusModel,
    getInvoicePaymentsHistoryModel,
    getInvoicesByContactModel
} = require('../../model/admin/invoiceModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for payment proof uploads
const invoiceUploadDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(invoiceUploadDir)) {
    fs.mkdirSync(invoiceUploadDir, { recursive: true });
}

const invoiceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, invoiceUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + cleanName);
    }
});

const invoiceUpload = multer({
    storage: invoiceStorage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

/**
 * @desc Upload Payment Proof File (screenshot, receipt, pdf)
 * @route POST /admin/crm/invoices/upload-proof
 */
const uploadInvoiceProof = [
    invoiceUpload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ status: false, msg: 'No file uploaded.' });
        }
        const fileUrl = `/uploads/invoices/${req.file.filename}`;
        res.status(200).json({
            status: true,
            msg: 'Proof file uploaded successfully!',
            file_url: fileUrl,
            file_name: req.file.originalname,
            file_size: req.file.size
        });
    })
];

/**
 * @desc Manually Update Invoice Payment Status
 * @route POST /admin/crm/invoices/:id/payment-status
 */
const updateInvoicePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { payment_status, payment_method, payment_note, proof_file, amount_paid } = req.body;
    const userId = req.user?.id || null;

    if (!payment_status) {
        return res.status(400).json({ status: false, msg: 'Payment status is required.' });
    }

    const result = await updateInvoicePaymentStatusModel(id, {
        payment_status,
        payment_method,
        payment_note,
        proof_file,
        amount_paid,
        user_id: userId
    });

    res.status(200).json({
        status: true,
        data: result,
        msg: `Invoice payment status updated to ${payment_status.toUpperCase()}.`
    });
});

/**
 * @desc Get Invoice Payment History
 * @route GET /admin/crm/invoices/:id/payments
 */
const getInvoicePaymentsHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payments = await getInvoicePaymentsHistoryModel(id);
    res.status(200).json({
        status: true,
        payments,
        msg: 'Invoice payment history retrieved.'
    });
});

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
 * @desc Get WhatsApp Templates List
 * @route GET /admin/crm/invoices/templates
 */
const getWhatsAppTemplates = asyncHandler(async (req, res) => {
    const { category = '' } = req.query;
    const templates = await getWhatsAppTemplatesModel({ category });
    res.status(200).json({
        status: true,
        data: templates,
        msg: 'WhatsApp templates retrieved successfully.'
    });
});

/**
 * @desc Create New WhatsApp Template
 * @route POST /admin/crm/invoices/templates
 */
const createWhatsAppTemplate = asyncHandler(async (req, res) => {
    const result = await createWhatsAppTemplateModel(req.body);
    res.status(201).json({
        status: true,
        data: result,
        msg: '🎉 WhatsApp template created successfully.'
    });
});

/**
 * @desc Update WhatsApp Template
 * @route PUT /admin/crm/invoices/templates/:id
 */
const updateWhatsAppTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await updateWhatsAppTemplateModel(id, req.body);
    res.status(200).json({
        status: true,
        data: result,
        msg: 'WhatsApp template updated successfully.'
    });
});

/**
 * @desc Delete WhatsApp Template
 * @route DELETE /admin/crm/invoices/templates/:id
 */
const deleteWhatsAppTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await deleteWhatsAppTemplateModel(id);
    res.status(200).json({
        status: true,
        msg: 'WhatsApp template deleted successfully.'
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
 * @desc Create New Invoice (with auto Razorpay Payment link & WhatsApp delivery)
 * @route POST /admin/crm/invoices
 */
const createInvoice = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id || 1;
    const result = await createInvoiceModel(req.body, currentUserId);
    res.status(201).json({
        status: true,
        data: result,
        msg: result.whatsapp_sent 
            ? '🎉 Invoice created & WhatsApp message with Razorpay payment link sent to customer!' 
            : '🎉 Invoice created successfully with Razorpay payment link.'
    });
});

/**
 * @desc Send / Re-send WhatsApp Message for Invoice
 * @route POST /admin/crm/invoices/:id/send-whatsapp
 */
const sendInvoiceWhatsApp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await sendInvoiceWhatsAppModel(id, req.body);
    res.status(200).json({
        status: true,
        data: result,
        msg: result.cloud_api_sent 
            ? '🚀 WhatsApp invoice message delivered successfully!' 
            : 'WhatsApp invoice message logged to CRM chat.'
    });
});

/**
 * @desc Generate / Refresh Razorpay Payment Link
 * @route POST /admin/crm/invoices/:id/payment-link
 */
const generateInvoicePaymentLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const result = await generateInvoicePaymentLinkModel(id, amount);
    res.status(200).json({
        status: true,
        data: result,
        msg: 'Razorpay payment link generated successfully.'
    });
});

/**
 * @desc Auto-Settle / Sync Razorpay Payment Link Status for an Invoice
 * @route POST /admin/crm/invoices/:id/sync-payment
 */
const syncInvoicePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
        autoSettleInvoiceFromRazorpay, 
        getInvoiceDetailsModel, 
        getInvoiceConfigModel 
    } = require('../../model/admin/invoiceModel');

    const invoice = await getInvoiceDetailsModel(id);
    if (!invoice) {
        return res.status(404).json({ status: false, msg: 'Invoice not found.' });
    }

    if (!invoice.razorpay_payment_link_id) {
        return res.status(400).json({ status: false, msg: 'No Razorpay payment link attached to this invoice yet.' });
    }

    const config = await getInvoiceConfigModel();
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
        key_id: config?.razorpay_key_id || process.env.RAZORPAY_KEY_ID || 'rzp_test_RQWjJm9q5lEiA8',
        key_secret: config?.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || 'XwAWgPdeymk9XLHqndmSD27c'
    });

    try {
        const plink = await rzp.paymentLink.fetch(invoice.razorpay_payment_link_id);
        if (plink?.status === 'paid' || (plink?.amount_paid && plink.amount_paid > 0)) {
            const settleResult = await autoSettleInvoiceFromRazorpay({
                paymentLinkId: plink.id,
                amount: plink.amount_paid,
                invoiceNo: invoice.invoice_no,
                notes: plink.notes
            });

            return res.status(200).json({
                status: true,
                settled: true,
                data: settleResult,
                msg: `🎉 Payment verified on Razorpay! Invoice #${invoice.invoice_no} has been auto-settled to '${settleResult.new_status || 'paid'}'.`
            });
        } else {
            return res.status(200).json({
                status: true,
                settled: false,
                payment_link_status: plink?.status || 'created',
                msg: `Razorpay payment link status is currently: ${plink?.status || 'created'}. No payment recorded yet.`
            });
        }
    } catch (rzpErr) {
        console.error('Error fetching Razorpay payment link:', rzpErr);
        return res.status(500).json({ status: false, msg: rzpErr.message || 'Failed to check Razorpay status.' });
    }
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
    if (Number(req.user?.admin) !== 1) {
        return res.status(403).json({
            status: false,
            msg: 'Access denied: Only administrators can delete invoices. Employees are not permitted to delete invoices.'
        });
    }
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

/**
 * @desc Get All Invoices & Complete Payment Timings for a Lead / Contact
 * @route GET /admin/crm/invoices/by-contact/:contactId
 */
const getInvoicesByContact = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { phone } = req.query;
    const data = await getInvoicesByContactModel(contactId, phone);
    res.status(200).json({
        status: true,
        ...data,
        msg: 'Invoices and payment history for contact fetched successfully.'
    });
});

module.exports = {
    getInvoiceConfig,
    updateInvoiceConfig,
    getWhatsAppTemplates,
    createWhatsAppTemplate,
    updateWhatsAppTemplate,
    deleteWhatsAppTemplate,
    getNextInvoiceNumber,
    createInvoice,
    getInvoicesList,
    getInvoiceDetails,
    deleteInvoice,
    getBillingStats,
    sendInvoiceWhatsApp,
    generateInvoicePaymentLink,
    syncInvoicePaymentStatus,
    uploadInvoiceProof,
    updateInvoicePaymentStatus,
    getInvoicePaymentsHistory,
    getInvoicesByContact
};
