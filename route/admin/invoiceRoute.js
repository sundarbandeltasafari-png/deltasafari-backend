const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare, superAdminAuthMiddleWare } = require('../../middleware/middleware');
const {
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
} = require('../../controller/admin/invoiceController');

// Configuration: All admin users can view config (needed for invoice generation/preview), but only Super Admin can update
router.get('/config', adminAuthMiddleWare, getInvoiceConfig);
router.post('/config', superAdminAuthMiddleWare, updateInvoiceConfig);

// WhatsApp Templates Management
router.get('/templates', adminAuthMiddleWare, getWhatsAppTemplates);
router.post('/templates', adminAuthMiddleWare, createWhatsAppTemplate);
router.put('/templates/:id', adminAuthMiddleWare, updateWhatsAppTemplate);
router.delete('/templates/:id', superAdminAuthMiddleWare, deleteWhatsAppTemplate);

// Payment proof upload
router.post('/upload-proof', adminAuthMiddleWare, uploadInvoiceProof);

// Invoices & Billing: Accessible to all admin users
router.get('/next-number', adminAuthMiddleWare, getNextInvoiceNumber);
router.get('/stats', adminAuthMiddleWare, getBillingStats);
router.get('/by-contact/:contactId', adminAuthMiddleWare, getInvoicesByContact);
router.get('/', adminAuthMiddleWare, getInvoicesList);
router.post('/', adminAuthMiddleWare, createInvoice);
router.get('/:id', adminAuthMiddleWare, getInvoiceDetails);
router.delete('/:id', superAdminAuthMiddleWare, deleteInvoice);

// Payment Status & History (Accessible to both admin & employee)
router.post('/:id/payment-status', adminAuthMiddleWare, updateInvoicePaymentStatus);
router.get('/:id/payments', adminAuthMiddleWare, getInvoicePaymentsHistory);

// Instant WhatsApp Send & Payment Link Generation
router.post('/:id/send-whatsapp', adminAuthMiddleWare, sendInvoiceWhatsApp);
router.post('/:id/payment-link', adminAuthMiddleWare, generateInvoicePaymentLink);
router.post('/:id/sync-payment', adminAuthMiddleWare, syncInvoicePaymentStatus);

module.exports = router;
