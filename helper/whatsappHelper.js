const dotenv = require('dotenv');
dotenv.config();

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

/**
 * Clean phone number to standard digits format
 * @param {string} phone 
 * @returns {string}
 */
const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
};

/**
 * Send an outbound text message via WhatsApp Business Cloud API
 * @param {string} toPhoneNumber - Destination phone number (E.164 format digits only)
 * @param {string} textMessage - Message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: any}>}
 */
const sendWhatsAppCloudMessage = async (toPhoneNumber, textMessage) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN || WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneId) {
            console.warn("[WhatsApp Helper] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env");
            return {
                success: false,
                simulated: true,
                messageId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                warning: "WhatsApp credentials not configured yet in .env; message recorded in CRM database."
            };
        }

        const cleanRecipient = normalizePhoneNumber(toPhoneNumber);
        const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanRecipient,
            type: "text",
            text: {
                preview_url: false,
                body: textMessage
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data?.messages && data.messages.length > 0) {
            return {
                success: true,
                messageId: data.messages[0].id,
                data
            };
        } else {
            console.error("[WhatsApp Cloud API Error]:", data);
            return {
                success: false,
                error: data?.error?.message || "Failed to send WhatsApp message via Meta Cloud API",
                details: data
            };
        }
    } catch (error) {
        console.error("[WhatsApp Helper Exception]:", error);
        return {
            success: false,
            error: error.message || "Internal error sending WhatsApp message"
        };
    }
};

/**
 * Extract contacts and messages from Meta Webhook payload
 * @param {object} body - Meta Webhook Body
 * @returns {Array<{contact: {wa_id: string, name: string}, message: {message_id: string, from: string, timestamp: string, type: string, text: string, media_url: string, media_type: string}}>}
 */
const extractWhatsAppWebhookEvents = (body) => {
    const results = [];

    if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
        return results;
    }

    for (const entry of body.entry) {
        if (!Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
            if (change.field !== 'messages' || !change.value) continue;

            const value = change.value;
            const contactsMap = {};

            // Map contacts by wa_id
            if (Array.isArray(value.contacts)) {
                for (const c of value.contacts) {
                    contactsMap[c.wa_id] = c.profile?.name || c.wa_id;
                }
            }

            // Extract messages
            if (Array.isArray(value.messages)) {
                for (const msg of value.messages) {
                    const fromWaId = msg.from;
                    const contactName = contactsMap[fromWaId] || `Lead ${fromWaId}`;
                    let messageText = '';
                    let mediaUrl = null;
                    let mediaType = msg.type || 'text';

                    if (msg.type === 'text' && msg.text?.body) {
                        messageText = msg.text.body;
                    } else if (msg.type === 'image') {
                        messageText = msg.image?.caption || '[Image received]';
                        mediaUrl = msg.image?.id || null;
                    } else if (msg.type === 'document') {
                        messageText = msg.document?.caption || `[Document: ${msg.document?.filename || 'File'}]`;
                        mediaUrl = msg.document?.id || null;
                    } else if (msg.type === 'audio') {
                        messageText = '[Voice note / Audio message]';
                        mediaUrl = msg.audio?.id || null;
                    } else if (msg.type === 'video') {
                        messageText = msg.video?.caption || '[Video message]';
                        mediaUrl = msg.video?.id || null;
                    } else if (msg.type === 'location') {
                        messageText = `[Location: Lat ${msg.location?.latitude}, Long ${msg.location?.longitude}]`;
                    } else if (msg.type === 'button') {
                        messageText = msg.button?.text || '[Button click]';
                    } else if (msg.type === 'interactive') {
                        messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive reply]';
                    } else {
                        messageText = `[${msg.type} message]`;
                    }

                    results.push({
                        contact: {
                            wa_id: fromWaId,
                            name: contactName
                        },
                        message: {
                            message_id: msg.id,
                            from: fromWaId,
                            timestamp: msg.timestamp || String(Math.floor(Date.now() / 1000)),
                            type: mediaType,
                            text: messageText,
                            media_url: mediaUrl,
                            media_type: mediaType
                        }
                    });
                }
            }
        }
    }

    return results;
};

module.exports = {
    normalizePhoneNumber,
    sendWhatsAppCloudMessage,
    extractWhatsAppWebhookEvents
};
