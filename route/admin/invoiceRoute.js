const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleWare } = require('../../middleware/middleware');
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

router.get('/config', superAdminAuthMiddleWare, getInvoiceConfig);
router.post('/config', superAdminAuthMiddleWare, updateInvoiceConfig);
router.get('/next-number', superAdminAuthMiddleWare, getNextInvoiceNumber);
router.get('/stats', superAdminAuthMiddleWare, getBillingStats);
router.get('/', superAdminAuthMiddleWare, getInvoicesList);
router.post('/', superAdminAuthMiddleWare, createInvoice);
router.get('/:id', superAdminAuthMiddleWare, getInvoiceDetails);
router.delete('/:id', superAdminAuthMiddleWare, deleteInvoice);

module.exports = router;
