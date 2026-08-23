const express = require('express');
const router = express.Router();
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const {
    getMarketingAudienceLeads,
    createAndLaunchWhatsAppCampaign,
    getWhatsAppCampaignsList,
    getWhatsAppCampaignDetails
} = require('../../controller/admin/whatsappMarketingController');

// All WhatsApp Marketing endpoints protected by adminAuthMiddleWare
router.get('/leads', adminAuthMiddleWare, getMarketingAudienceLeads);
router.post('/campaigns', adminAuthMiddleWare, createAndLaunchWhatsAppCampaign);
router.get('/campaigns', adminAuthMiddleWare, getWhatsAppCampaignsList);
router.get('/campaigns/:id', adminAuthMiddleWare, getWhatsAppCampaignDetails);

module.exports = router;
