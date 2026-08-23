const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare, superAdminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getInvoiceConfig,
    updateInvoiceConfig,
    getNextInvoiceNumber,
    createInvoice,
    getInvoicesList,
    getInvoiceDetails,
    deleteInvoice,
    getBillingStats
} = require('../../controller/admin/invoiceController');

// Configuration: All admin users can view config (needed for invoice generation/preview), but only Super Admin can update
router.get('/config', adminAuthMiddleWare, getInvoiceConfig);
router.post('/config', superAdminAuthMiddleWare, updateInvoiceConfig);

// Invoices & Billing: Accessible to all admin users
router.get('/next-number', adminAuthMiddleWare, getNextInvoiceNumber);
router.get('/stats', adminAuthMiddleWare, getBillingStats);
router.get('/', adminAuthMiddleWare, getInvoicesList);
router.post('/', adminAuthMiddleWare, createInvoice);
router.get('/:id', adminAuthMiddleWare, getInvoiceDetails);
router.delete('/:id', superAdminAuthMiddleWare, deleteInvoice);

module.exports = router;
