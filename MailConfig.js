const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Mailjet = require('node-mailjet');

/**
 * Returns the configured mail medium.
 * Options: 'smtp' | 'mailjet' (default: 'mailjet')
 */
function getMailMedium() {
    const medium = (process.env.MAIL_MEDIUM || process.env.MAIL_DRIVER || 'mailjet').trim().toLowerCase();
    if (medium === 'smtp' || medium === 'nodemailer') {
        return 'smtp';
    }
    return 'mailjet';
}

/**
 * Sends email using Mailjet API v3.1
 */
function sendViaMailjet(toEmail, toName, subject, html) {
    const apiKeyPublic = process.env.MJ_APIKEY_PUBLIC;
    const apiKeyPrivate = process.env.MJ_APIKEY_PRIVATE;
    const fromEmail = process.env.MJ_FROM_EMAIL || 'info@deltasafari.in';
    const fromName = process.env.MJ_FROM_NAME || process.env.APP_NAME || 'Delta Safari';

    if (!apiKeyPublic || !apiKeyPrivate) {
        return Promise.reject(new Error('Mailjet API keys (MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE) are not configured in .env'));
    }

    const mailjet = Mailjet.apiConnect(apiKeyPublic, apiKeyPrivate);

    return mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: {
                        Email: fromEmail,
                        Name: fromName,
                    },
                    To: [
                        {
                            Email: toEmail,
                            Name: toName || toEmail,
                        },
                    ],
                    Subject: subject,
                    HtmlPart: html,
                },
            ],
        });
}

/**
 * Sends email using SMTP (via Nodemailer)
 */
function sendViaSmtp(toEmail, toName, subject, html) {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || process.env.MJ_FROM_EMAIL;
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser || process.env.MJ_FROM_EMAIL || 'info@deltasafari.in';
    const fromName = process.env.SMTP_FROM_NAME || process.env.MJ_FROM_NAME || process.env.APP_NAME || 'Delta Safari';

    const transportOptions = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: (smtpUser && smtpPass) ? {
            user: smtpUser,
            pass: smtpPass,
        } : undefined,
        tls: {
            rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true',
        },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: toName ? `"${toName}" <${toEmail}>` : toEmail,
        subject: subject,
        html: html,
    };

    return transporter.sendMail(mailOptions);
}

/**
 * Universal Mail Dispatcher
 * Automatically routes email delivery to 'smtp' or 'mailjet' based on MAIL_MEDIUM in .env
 */
function mailDispatcher(toEmail, toName, subject, html) {
    const medium = getMailMedium();

    if (medium === 'smtp') {
        return sendViaSmtp(toEmail, toName, subject, html);
    } else {
        return sendViaMailjet(toEmail, toName, subject, html);
    }
}

// Exports for backward compatibility and flexibility
mailDispatcher.sendMail = mailDispatcher;
mailDispatcher.mailJetConf = mailDispatcher;
mailDispatcher.sendViaSmtp = sendViaSmtp;
mailDispatcher.sendViaMailjet = sendViaMailjet;
mailDispatcher.getMailMedium = getMailMedium;

module.exports = mailDispatcher;
