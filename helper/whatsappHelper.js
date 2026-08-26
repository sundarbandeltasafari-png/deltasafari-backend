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
 * Helper to extract text and media details from message object
 * @param {object|string} msg 
 * @returns {{text: string, mediaUrl: string|null, mediaType: string}}
 */
const extractMessageContent = (msg) => {
    if (!msg) return { text: '', mediaUrl: null, mediaType: 'text' };
    
    if (typeof msg === 'string') {
        return { text: msg, mediaUrl: null, mediaType: 'text' };
    }

    let text = '';
    let mediaUrl = null;
    let mediaType = msg.type || 'text';

    if (typeof msg.text === 'string') {
        text = msg.text;
    } else if (msg.text?.body) {
        text = msg.text.body;
    } else if (msg.body) {
        text = msg.body;
    } else if (msg.type === 'image' || msg.image) {
        mediaType = 'image';
        text = msg.image?.caption || msg.caption || '[Image received]';
        mediaUrl = msg.image?.id || msg.image?.url || msg.image?.link || null;
    } else if (msg.type === 'document' || msg.document) {
        mediaType = 'document';
        text = msg.document?.caption || `[Document: ${msg.document?.filename || 'File'}]`;
        mediaUrl = msg.document?.id || msg.document?.url || msg.document?.link || null;
    } else if (msg.type === 'audio' || msg.audio) {
        mediaType = 'audio';
        text = '[Voice note / Audio message]';
        mediaUrl = msg.audio?.id || msg.audio?.url || null;
    } else if (msg.type === 'video' || msg.video) {
        mediaType = 'video';
        text = msg.video?.caption || '[Video message]';
        mediaUrl = msg.video?.id || msg.video?.url || null;
    } else if (msg.type === 'location' || msg.location) {
        mediaType = 'location';
        text = `[Location: Lat ${msg.location?.latitude}, Long ${msg.location?.longitude}]`;
    } else if (msg.type === 'button' || msg.button) {
        mediaType = 'button';
        text = msg.button?.text || msg.button?.payload || '[Button click]';
    } else if (msg.type === 'interactive' || msg.interactive) {
        mediaType = msg.interactive?.type || 'interactive';
        text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Interactive reply]';
    } else if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const att = msg.attachments[0];
        mediaType = att.type || 'file';
        mediaUrl = att.payload?.url || null;
        text = msg.text || `[${mediaType} attachment]`;
    } else if (msg.type) {
        text = `[${msg.type} message]`;
    }

    if (msg.commands && Array.isArray(msg.commands) && msg.commands.length > 0) {
        const cmdList = msg.commands.map(c => typeof c === 'object' ? c.name : c).filter(Boolean);
        if (cmdList.length > 0) {
            text = text ? `${text} (Commands: ${cmdList.join(', ')})` : `Commands: ${cmdList.join(', ')}`;
        }
    }

    return { text: text || '', mediaUrl, mediaType };
};

/**
 * Normalizes a single message event into standard CRM format
 */
const buildNormalizedEvent = ({ senderId, senderName, messageId, timestamp, messageObj, defaultMediaType, defaultMediaUrl }) => {
    if (!senderId) return null;
    const cleanSenderId = String(senderId).trim();
    if (!cleanSenderId) return null;

    const content = extractMessageContent(messageObj);
    const msgId = messageId || (typeof messageObj === 'object' ? (messageObj.mid || messageObj.id || messageObj.message_id) : null) || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ts = timestamp ? String(timestamp) : String(Math.floor(Date.now() / 1000));
    const name = senderName || `Lead ${cleanSenderId}`;

    return {
        contact: {
            wa_id: cleanSenderId,
            name: name
        },
        message: {
            message_id: msgId,
            from: cleanSenderId,
            timestamp: ts,
            type: content.mediaType || defaultMediaType || 'text',
            text: content.text,
            media_url: content.mediaUrl || defaultMediaUrl || null,
            media_type: content.mediaType || defaultMediaType || 'text'
        }
    };
};

/**
 * Process a "value" object from change / sample / direct events
 */
const processValueObject = (value, results) => {
    if (!value || typeof value !== 'object') return;

    const contactsMap = {};
    const contactsList = [];
    if (Array.isArray(value.contacts)) {
        for (const c of value.contacts) {
            const rawWaId = c.wa_id || c.phone || c.id || c.user_id;
            if (rawWaId) {
                const waId = String(rawWaId).trim();
                const name = c.profile?.name || c.name || waId;
                contactsMap[waId] = name;
                contactsList.push({ wa_id: waId, name });
            }
        }
    }

    const processedContactIds = new Set();

    // Format 1: WhatsApp Cloud API messages array (Standard and Direct { field: 'messages', value: { contacts: [...], messages: [...] } })
    if (Array.isArray(value.messages) && value.messages.length > 0) {
        for (const msg of value.messages) {
            const fromWaId = msg.from || msg.sender || (msg.from_user_id ? String(msg.from_user_id) : null);
            if (!fromWaId) continue;
            const cleanFromWaId = String(fromWaId).trim();
            const contactName = contactsMap[cleanFromWaId] || contactsMap[fromWaId] || `Lead ${cleanFromWaId}`;
            processedContactIds.add(cleanFromWaId);

            const event = buildNormalizedEvent({
                senderId: cleanFromWaId,
                senderName: contactName,
                messageId: msg.id || msg.mid,
                timestamp: msg.timestamp || value.timestamp,
                messageObj: msg
            });
            if (event) results.push(event);
        }
    }

    // Format 2: Sample / Test Webhook or single sender & message object
    // e.g. { sender: { id: '12334' }, recipient: { id: '23245' }, timestamp: '...', message: { mid: '...', text: '...' } }
    if (value.sender || value.message || (value.from && (!Array.isArray(value.messages) || value.messages.length === 0))) {
        const senderId = value.sender?.id || value.from || value.sender;
        if (senderId) {
            const cleanSenderId = String(senderId).trim();
            const senderName = value.sender?.name || contactsMap[cleanSenderId] || contactsMap[senderId] || `Lead ${cleanSenderId}`;
            processedContactIds.add(cleanSenderId);

            const msgObj = value.message || value;
            const msgId = msgObj.mid || msgObj.id || msgObj.message_id || value.mid;
            const timestamp = value.timestamp || msgObj.timestamp;

            const event = buildNormalizedEvent({
                senderId: cleanSenderId,
                senderName,
                messageId: msgId,
                timestamp,
                messageObj: msgObj
            });
            if (event) results.push(event);
        }
    }

    // Format 3: Standalone Contacts without messages (or extra contacts not in messages array)
    // Ensures new contacts are ALWAYS inserted into the database even if no message is present
    for (const c of contactsList) {
        if (!processedContactIds.has(c.wa_id)) {
            results.push({
                contact: {
                    wa_id: c.wa_id,
                    name: c.name
                },
                message: null
            });
            processedContactIds.add(c.wa_id);
        }
    }
};

/**
 * Extract contacts and messages from Meta Webhook payload
 * Supports:
 * 1. Direct { field: 'messages', value: { contacts: [...], messages: [...] } }
 * 2. Meta Dashboard Sample / Test Payloads ({ sample: { field: "messages", value: { ... } } })
 * 3. Standard WhatsApp Business Cloud API Payloads ({ object: "whatsapp_business_account", entry: [ { changes: [...] } ] })
 * 4. Meta Messenger / Instagram Page Webhooks ({ object: "page", entry: [ { messaging: [...] } ] })
 * 5. Direct message payload ({ sender, message } or { from, text })
 * 6. Contact-only payload ({ contacts: [...] })
 * 
 * @param {object} body - Webhook Body
 * @returns {Array<{contact: {wa_id: string, name: string}, message: {message_id: string, from: string, timestamp: string, type: string, text: string, media_url: string|null, media_type: string}|null}>}
 */
const extractWhatsAppWebhookEvents = (body) => {
    const results = [];
    if (!body || typeof body !== 'object') {
        return results;
    }

    // 1. Direct root-level { field: "messages", value: { ... } } (Meta test event or direct webhook)
    if ((body.field === 'messages' || body.field === 'message' || body.field === 'contacts') && body.value) {
        processValueObject(body.value, results);
        if (results.length > 0) return results;
    }

    // 2. Meta sample payload wrapper ({ sample: { field: "messages", value: { ... } } })
    if (body.sample && typeof body.sample === 'object') {
        const sampleVal = body.sample.value || body.sample;
        processValueObject(sampleVal, results);
        if (results.length > 0) return results;
    }

    // 3. Standard Meta "entry" array (WhatsApp Business Cloud API / Messenger)
    if (Array.isArray(body.entry)) {
        for (const entry of body.entry) {
            // A) entry.changes array (WhatsApp Cloud API / Webhook change notifications)
            if (Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    if (change && change.value) {
                        processValueObject(change.value, results);
                    }
                }
            }

            // B) entry.messaging array (Facebook Messenger / Instagram webhook format)
            if (Array.isArray(entry.messaging)) {
                for (const msgItem of entry.messaging) {
                    const senderId = msgItem.sender?.id;
                    const senderName = msgItem.sender?.name;
                    const msgObj = msgItem.message || {};
                    const event = buildNormalizedEvent({
                        senderId,
                        senderName,
                        messageId: msgObj.mid || msgObj.id,
                        timestamp: msgItem.timestamp || entry.time,
                        messageObj: msgObj
                    });
                    if (event) results.push(event);
                }
            }
        }
        if (results.length > 0) return results;
    }

    // 4. Direct payload with value property or direct sender/message/from/messages/contacts
    if (body.value) {
        processValueObject(body.value, results);
        if (results.length > 0) return results;
    }

    if (body.sender || body.from || body.message || body.messages || body.contacts) {
        processValueObject(body, results);
    }

    return results;
};

module.exports = {
    normalizePhoneNumber,
    sendWhatsAppCloudMessage,
    extractWhatsAppWebhookEvents
};
