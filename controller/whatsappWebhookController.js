const { extractWhatsAppWebhookEvents } = require('../helper/whatsappHelper');
const { upsertWhatsAppContact, saveWhatsAppIncomingMessage } = require('../model/admin/whatsappModel');
const { getIO } = require('../socket/chatSocket');

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
        console.log('[WhatsApp Webhook Inbound Payload]:', JSON.stringify(body));

        // Extract normalized events from any supported Meta / WhatsApp / Messenger payload format
        const events = extractWhatsAppWebhookEvents(body);

        if (!events || events.length === 0) {
            console.log('[WhatsApp Webhook]: No message events extracted from payload');
            return res.status(200).send('EVENT_RECEIVED');
        }

        console.log(`[WhatsApp Webhook]: Received ${events.length} message event(s) to process`);

        const io = getIO();

        for (const item of events) {
            try {
                const { contact, message } = item;
                if (!contact || !contact.wa_id) continue;

                // 1. Upsert contact (finds or creates, and auto-assigns to admin user if new)
                const contactRecord = await upsertWhatsAppContact(contact.wa_id, contact.name);

                let savedMessage = null;
                // 2. Save incoming message in database if message data is present
                if (message && (message.text !== undefined || message.media_url || message.message_id)) {
                    savedMessage = await saveWhatsAppIncomingMessage({
                        contactId: contactRecord.id,
                        messageId: message.message_id,
                        messageText: message.text,
                        mediaUrl: message.media_url,
                        mediaType: message.media_type,
                        timestamp: message.timestamp
                    });
                }

                console.log(`[WhatsApp Webhook Processed]: Contact: "${contactRecord.name}" (${contactRecord.wa_id})${savedMessage ? `, Message: "${savedMessage.message_text || savedMessage.id}"` : ' (Contact only)'}`);

                // 3. Real-time broadcast to connected admin clients via Socket.io
                if (io) {
                    io.emit('whatsapp_message_received', {
                        contact: contactRecord,
                        message: savedMessage
                    });
                }
            } catch (eventErr) {
                console.error('[WhatsApp Webhook Event Processing Error]:', eventErr);
            }
        }

        return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('[WhatsApp Webhook POST Error]:', error);
        return res.status(200).send('EVENT_RECEIVED');
    }
};

module.exports = {
    verifyWebhook,
    handleWebhook
};
