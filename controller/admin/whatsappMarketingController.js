const asyncHandler = require('express-async-handler');
const {
    getMarketingAudienceLeadsModel,
    createAndLaunchWhatsAppCampaignModel,
    getWhatsAppCampaignsListModel,
    getWhatsAppCampaignDetailsModel
} = require('../../model/admin/whatsappMarketingModel');

function maskPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    const clean = phone.trim();
    if (clean.length <= 4) return '****';
    const start = clean.slice(0, 4);
    const end = clean.slice(-2);
    return `${start}${'*'.repeat(Math.max(2, clean.length - 6))}${end}`;
}

/**
 * @desc Get WhatsApp Marketing Audience Leads (Supports All, Converted, Non-Converted)
 * @route GET /admin/whatsapp/marketing/leads
 */
const getMarketingAudienceLeads = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 25,
        search = '',
        conversion_status = 'all',
        lead_type = '',
        destination = '',
        date_filter_type = 'created_at',
        from_date = '',
        to_date = '',
        assigned_to = ''
    } = req.query;

    const requestingUser = req.user;
    const isSuperAdmin = requestingUser?.admin === 1;

    const result = await getMarketingAudienceLeadsModel({
        page,
        limit,
        search,
        conversion_status,
        lead_type,
        destination,
        date_filter_type,
        from_date,
        to_date,
        assigned_to,
        requestingUser
    });

    // Privacy Masking for regular admin users
    if (!isSuperAdmin && result.leads) {
        result.leads = result.leads.map(lead => ({
            ...lead,
            phone: maskPhoneNumber(lead.phone),
            wa_id: maskPhoneNumber(lead.wa_id)
        }));
    }

    res.status(200).json({
        status: true,
        data: result
    });
});

/**
 * @desc Create and Launch or Schedule WhatsApp Marketing Campaign
 * @route POST /admin/whatsapp/marketing/campaigns
 */
const createAndLaunchWhatsAppCampaign = asyncHandler(async (req, res) => {
    const {
        campaign_name,
        message_text,
        media_url,
        media_type,
        cta_url,
        cta_text,
        schedule_type = 'instant',
        scheduled_at,
        recipient_ids = [],
        target_all_filtered = false,
        filter_params = {}
    } = req.body;

    if (!campaign_name || !campaign_name.trim()) {
        return res.status(400).json({ status: false, msg: "Campaign Name is required." });
    }
    if (!message_text || !message_text.trim()) {
        return res.status(400).json({ status: false, msg: "Message Content is required." });
    }
    if (!target_all_filtered && (!Array.isArray(recipient_ids) || recipient_ids.length === 0)) {
        return res.status(400).json({ status: false, msg: "Please select at least one lead recipient for the campaign." });
    }
    if (schedule_type === 'scheduled' && !scheduled_at) {
        return res.status(400).json({ status: false, msg: "Please specify date and time for scheduled campaign." });
    }

    const requestingUser = req.user;

    const result = await createAndLaunchWhatsAppCampaignModel({
        campaign_name,
        message_text,
        media_url,
        media_type,
        cta_url,
        cta_text,
        schedule_type,
        scheduled_at,
        recipient_ids,
        target_all_filtered,
        filter_params,
        requestingUser
    });

    res.status(200).json({
        status: true,
        data: result,
        msg: result.msg || "Campaign processed successfully."
    });
});

/**
 * @desc Get List of WhatsApp Marketing Campaigns
 * @route GET /admin/whatsapp/marketing/campaigns
 */
const getWhatsAppCampaignsList = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        status = ''
    } = req.query;

    const requestingUser = req.user;

    const result = await getWhatsAppCampaignsListModel({
        page,
        limit,
        search,
        status,
        requestingUser
    });

    res.status(200).json({
        status: true,
        data: result
    });
});

/**
 * @desc Get Details and Logs of a WhatsApp Campaign
 * @route GET /admin/whatsapp/marketing/campaigns/:id
 */
const getWhatsAppCampaignDetails = asyncHandler(async (req, res) => {
    const campaignId = req.params.id;
    const requestingUser = req.user;
    const isSuperAdmin = requestingUser?.admin === 1;

    const result = await getWhatsAppCampaignDetailsModel(campaignId, requestingUser);

    if (!result) {
        return res.status(404).json({ status: false, msg: "Campaign not found." });
    }

    if (result.unauthorized) {
        return res.status(403).json({ status: false, msg: "You are not authorized to view this campaign." });
    }

    // Mask phone numbers for regular admin
    if (!isSuperAdmin && result.recipients) {
        result.recipients = result.recipients.map(r => ({
            ...r,
            phone: maskPhoneNumber(r.phone)
        }));
    }

    res.status(200).json({
        status: true,
        data: result
    });
});

module.exports = {
    getMarketingAudienceLeads,
    createAndLaunchWhatsAppCampaign,
    getWhatsAppCampaignsList,
    getWhatsAppCampaignDetails
};
