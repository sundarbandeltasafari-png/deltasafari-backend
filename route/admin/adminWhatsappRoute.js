const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare, superAdminAuthMiddleWare } = require('../../middleware/middleware');
const { 
    getContacts, 
    getMessages, 
    sendMessage, 
    getStats, 
    getConfigStatus,
    getLeadManagers,
    toggleLeadManager,
    assignLead,
    createManualLead,
    deleteContact
} = require('../../controller/admin/whatsappAdminController');

// All endpoints protected with adminAuthMiddleWare
router.get('/contacts', adminAuthMiddleWare, getContacts);
router.post('/contacts/manual', adminAuthMiddleWare, createManualLead);
router.post('/create-lead', adminAuthMiddleWare, createManualLead);
router.get('/messages/:contactId', adminAuthMiddleWare, getMessages);
router.post('/send', adminAuthMiddleWare, sendMessage);
router.get('/stats', adminAuthMiddleWare, getStats);
router.get('/config-status', adminAuthMiddleWare, getConfigStatus);

// Delete Contact / Lead (Super Admin only)
router.delete('/contacts/:contactId', superAdminAuthMiddleWare, deleteContact);
router.post('/contacts/:contactId/delete', superAdminAuthMiddleWare, deleteContact);

// Lead Distribution & Assignment Endpoints (Super Admin)
router.get('/lead-managers', adminAuthMiddleWare, getLeadManagers);
router.post('/lead-managers/toggle', adminAuthMiddleWare, toggleLeadManager);
router.post('/assign-lead', adminAuthMiddleWare, assignLead);

module.exports = router;
