const { 
    getWhatsAppContactsList, 
    getWhatsAppMessagesHistory, 
    saveWhatsAppOutgoingMessage, 
    getWhatsAppCRMStats,
    upsertWhatsAppContact,
    getLeadManagersListModel,
    toggleLeadManagerStatusModel,
    manuallyAssignLeadModel,
    getLeadDistributionStatsModel,
    createManualLeadModel,
    deleteWhatsAppContactModel
} = require('../../model/admin/whatsappModel');
const { sendWhatsAppCloudMessage, normalizePhoneNumber } = require('../../helper/whatsappHelper');

/**
 * Get all WhatsApp Contacts / Leads with role-based visibility
 */
const getContacts = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 50, assigned_to = '', lead_source = '' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;

        const result = await getWhatsAppContactsList({
            search,
            limit: limitNum,
            offset,
            requestingUser: req.user,
            assignedToFilter: assigned_to,
            leadSourceFilter: lead_source
        });

        return res.status(200).json({
            status: true,
            msg: 'WhatsApp contacts retrieved successfully',
            data: result.contacts,
            total: result.total,
            page: pageNum,
            limit: limitNum,
            is_super_admin: req.user?.admin === 1
        });
    } catch (error) {
        console.error('[Admin WhatsApp getContacts Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Get Conversation History for a Contact with strict access check
 */
const getMessages = async (req, res) => {
    try {
        const { contactId } = req.params;

        if (!contactId) {
            return res.status(400).json({ status: false, msg: 'Contact ID is required' });
        }

        const data = await getWhatsAppMessagesHistory(contactId, req.user);

        if (!data) {
            return res.status(404).json({ status: false, msg: 'WhatsApp Contact not found' });
        }

        if (data.unauthorized) {
            return res.status(403).json({ 
                status: false, 
                msg: 'Access Denied: You are not assigned to this lead.',
                contact: null,
                messages: []
            });
        }

        return res.status(200).json({
            status: true,
            msg: 'WhatsApp messages retrieved successfully',
            contact: data.contact,
            messages: data.messages
        });
    } catch (error) {
        console.error('[Admin WhatsApp getMessages Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Send WhatsApp Message / Reply to Customer
 */
const sendMessage = async (req, res) => {
    try {
        const { contact_id, phone_number, message_text } = req.body;

        if (!message_text || !message_text.trim()) {
            return res.status(400).json({ status: false, msg: 'Message text cannot be empty' });
        }

        let contactId = contact_id;
        let phoneNumber = phone_number;

        // If no contact_id but phone_number is provided, create/find contact
        if (!contactId && phoneNumber) {
            const cleanPhone = normalizePhoneNumber(phoneNumber);
            const contactRecord = await upsertWhatsAppContact(cleanPhone, `Lead ${cleanPhone}`);
            contactId = contactRecord.id;
        }

        if (!contactId) {
            return res.status(400).json({ status: false, msg: 'Contact ID or Phone number is required' });
        }

        // Verify assignment for regular admin users
        const history = await getWhatsAppMessagesHistory(contactId, req.user);
        if (!history || history.unauthorized) {
            return res.status(403).json({ status: false, msg: 'Access Denied: You cannot reply to a lead not assigned to you.' });
        }

        // If phone_number was not passed, lookup real wa_id from contact
        if (!phoneNumber || phoneNumber.includes('*')) {
            if (!history.contact) {
                return res.status(404).json({ status: false, msg: 'Contact not found' });
            }
            // For sending message, we need the real wa_id
            const rawContact = await getWhatsAppMessagesHistory(contactId, { admin: 1 });
            phoneNumber = rawContact?.contact?.wa_id;
        }

        // 1. Send message via Meta WhatsApp Business Cloud API
        const sendResult = await sendWhatsAppCloudMessage(phoneNumber, message_text.trim());

        // 2. Save outbound message in database
        const savedMessage = await saveWhatsAppOutgoingMessage({
            contactId,
            messageId: sendResult.messageId || null,
            messageText: message_text.trim()
        });

        return res.status(200).json({
            status: true,
            msg: sendResult.success 
                ? 'WhatsApp message sent successfully' 
                : (sendResult.warning || 'Message logged to CRM (WhatsApp Cloud API not active in .env)'),
            cloud_api_sent: sendResult.success,
            message: savedMessage,
            api_response: sendResult
        });
    } catch (error) {
        console.error('[Admin WhatsApp sendMessage Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Get WhatsApp CRM Overview Stats
 */
const getStats = async (req, res) => {
    try {
        const stats = await getWhatsAppCRMStats(req.user);
        return res.status(200).json({
            status: true,
            msg: 'WhatsApp stats retrieved successfully',
            stats
        });
    } catch (error) {
        console.error('[Admin WhatsApp getStats Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Get Meta Webhook & Cloud API Config Status
 */
const getConfigStatus = (req, res) => {
    try {
        const hasToken = !!process.env.WHATSAPP_ACCESS_TOKEN;
        const hasPhoneId = !!process.env.WHATSAPP_PHONE_NUMBER_ID;
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'deltasafari_wa_verify_2026';
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

        return res.status(200).json({
            status: true,
            configured: hasToken && hasPhoneId,
            has_access_token: hasToken,
            has_phone_id: hasPhoneId,
            phone_number_id: phoneId ? `${phoneId.substring(0, 4)}...${phoneId.substring(phoneId.length - 4)}` : 'Not Set',
            verify_token: verifyToken,
            webhook_path: '/webhook/whatsapp',
            api_version: process.env.WHATSAPP_API_VERSION || 'v19.0'
        });
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Get all Admin Users with Lead Distribution Settings (Super Admin Only)
 */
const getLeadManagers = async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Access Denied: Only Super Admin can manage lead distribution.' });
        }

        const managers = await getLeadManagersListModel();
        const stats = await getLeadDistributionStatsModel();

        return res.status(200).json({
            status: true,
            msg: 'Lead managers retrieved successfully',
            managers,
            stats
        });
    } catch (error) {
        console.error('[Admin WhatsApp getLeadManagers Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Toggle Admin User in Lead Distribution Pool (Super Admin Only)
 */
const toggleLeadManager = async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Access Denied: Only Super Admin can modify lead distribution pool.' });
        }

        const { user_id, is_active } = req.body;
        if (!user_id) {
            return res.status(400).json({ status: false, msg: 'User ID is required' });
        }

        await toggleLeadManagerStatusModel({ userId: user_id, isActive: is_active });

        return res.status(200).json({
            status: true,
            msg: `Lead distribution status updated for user.`
        });
    } catch (error) {
        console.error('[Admin WhatsApp toggleLeadManager Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Manually assign or reassign a lead to an admin user (Super Admin Only)
 */
const assignLead = async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Access Denied: Only Super Admin can reassign leads.' });
        }

        const { contact_id, user_id } = req.body;
        if (!contact_id) {
            return res.status(400).json({ status: false, msg: 'Contact ID is required' });
        }

        await manuallyAssignLeadModel({ contactId: contact_id, userId: user_id || null });

        return res.status(200).json({
            status: true,
            msg: user_id ? 'Lead successfully assigned to admin user.' : 'Lead unassigned successfully.'
        });
    } catch (error) {
        console.error('[Admin WhatsApp assignLead Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Create a Manual Lead (Direct Entry from CRM WhatsApp Leads)
 */
const createManualLead = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            assigned_to,
            lead_type,
            travel_date,
            booking_days,
            travel_destination,
            adults,
            children,
            infants,
            number_of_persons,
            total_rooms,
            rooms,
            room_details,
            package_name,
            package_rate,
            next_followup_date,
            extra_note,
            initial_message,
            send_message_now
        } = req.body;

        if (!phone || !String(phone).trim()) {
            return res.status(400).json({ status: false, msg: 'WhatsApp phone number is required.' });
        }

        const result = await createManualLeadModel({
            name,
            phone,
            email,
            assigned_to,
            lead_type,
            travel_date,
            booking_days,
            travel_destination,
            adults,
            children,
            infants,
            number_of_persons,
            total_rooms,
            rooms: rooms || room_details,
            room_details: rooms || room_details,
            package_name,
            package_rate,
            next_followup_date,
            extra_note,
            initial_message,
            send_message_now: !!send_message_now,
            requestingUser: req.user
        });

        return res.status(200).json({
            status: true,
            msg: result.is_new ? 'New WhatsApp lead created successfully.' : 'Lead updated successfully with new details.',
            data: result
        });
    } catch (error) {
        console.error('[Admin WhatsApp createManualLead Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal Server Error' });
    }
};

/**
 * Delete WhatsApp Lead / Contact (Admin / Super Admin Only)
 */
const deleteContact = async (req, res) => {
    try {
        if (req.user?.admin !== 1) {
            return res.status(403).json({
                status: false,
                msg: 'Access Denied: Only administrators have permission to delete WhatsApp leads.'
            });
        }

        const contactId = req.params.contactId || req.body.contact_id;
        if (!contactId) {
            return res.status(400).json({ status: false, msg: 'Contact ID is required.' });
        }

        const result = await deleteWhatsAppContactModel(contactId);
        if (result.notFound) {
            return res.status(404).json({ status: false, msg: 'WhatsApp lead not found or already deleted.' });
        }

        return res.status(200).json({
            status: true,
            msg: `WhatsApp lead "${result.contact?.name || result.contact?.wa_id}" deleted successfully.`,
            data: result.contact
        });
    } catch (error) {
        console.error('[Admin WhatsApp deleteContact Error]:', error);
        return res.status(500).json({ status: false, msg: error.message || 'Failed to delete WhatsApp lead.' });
    }
};

module.exports = {
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
};

