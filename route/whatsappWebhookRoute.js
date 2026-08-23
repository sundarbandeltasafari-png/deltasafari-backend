const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhook } = require('../controller/whatsappWebhookController');

// GET: Meta Webhook Verification
router.get('/', verifyWebhook);

// POST: Meta Webhook Inbound Message Events
router.post('/', handleWebhook);

module.exports = router;
