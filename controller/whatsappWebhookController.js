const { extractWhatsAppWebhookEvents } = require('../helper/whatsappHelper');
const { upsertWhatsAppContact, saveWhatsAppIncomingMessage } = require('../model/admin/whatsappModel');

/**
 * GET Handler: Verify Meta Webhook Challenge
 */
const verifyWebhook = (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'deltasafari_wa_verify_2026';

        if (mode && token) {
            if (mode === 'subscribe' && token === expectedVerifyToken) {
                console.log('[WhatsApp Webhook Verified Successfully]');
                return res.status(200).send(challenge);
            } else {
                console.warn(`[WhatsApp Webhook Verification Failed]: Token mismatch. Received: "${token}", Expected: "${expectedVerifyToken}"`);
                return res.status(403).json({ status: false, msg: 'Verification token mismatch' });
            }
        }

        return res.status(400).json({ status: false, msg: 'Missing hub.mode or hub.verify_token parameters' });
    } catch (error) {
        console.error('[WhatsApp Webhook Verify Error]:', error);
        return res.status(500).send('Internal Server Error');
    }
};

/**
 * POST Handler: Process Incoming Messages & Contacts
 */
const handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        // Meta requires an immediate HTTP 200 response to avoid resending webhooks
        res.status(200).send('EVENT_RECEIVED');

        // Extract normalized events
        const events = extractWhatsAppWebhookEvents(body);

        if (!events || events.length === 0) {
            return;
        }

        console.log(`[WhatsApp Webhook]: Received ${events.length} message event(s)`);

        for (const item of events) {
            try {
                const { contact, message } = item;

                // 1. Upsert contact
                const contactRecord = await upsertWhatsAppContact(contact.wa_id, contact.name);

                // 2. Save incoming message
                await saveWhatsAppIncomingMessage({
                    contactId: contactRecord.id,
                    messageId: message.message_id,
                    messageText: message.text,
                    mediaUrl: message.media_url,
                    mediaType: message.media_type,
                    timestamp: message.timestamp
                });

                console.log(`[WhatsApp Webhook Processed]: Contact: ${contactRecord.name} (${contactRecord.wa_id}), Message: "${message.text}"`);
            } catch (eventErr) {
                console.error('[WhatsApp Webhook Event Processing Error]:', eventErr);
            }
        }
    } catch (error) {
        console.error('[WhatsApp Webhook POST Error]:', error);
        // Note: res.status(200) was already sent
    }
};

module.exports = {
    verifyWebhook,
    handleWebhook
};
