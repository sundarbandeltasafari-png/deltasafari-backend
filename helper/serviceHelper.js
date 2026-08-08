const mailJetConf = require('../MailConfig');
const twilioConfig = require('../twilioConfig');
const {
    buildRegisterOtpHtml,
    buildForgotPasswordOtpHtml,
    buildLoginOtpHtml,
    buildBookingConfirmationHtml,
    buildCustomEnquiryConfirmationHtml
} = require('./emailTemplateHelper');

const sendOtp = (toEmail, toName, otp, type) => {
    const appName = process.env.APP_NAME || 'Delta Safari';
    const recipientName = toName || 'Valued Traveler';

    if (validateEmail(toEmail)) {
        let subject = `Verify Registration - ${appName}`;
        let html = buildRegisterOtpHtml(otp, recipientName);

        if (type === 'reset' || type === 'forgot') {
            subject = `Reset Password Verification Code - ${appName}`;
            html = buildForgotPasswordOtpHtml(otp, recipientName);
        } else if (type === 'login-otp') {
            subject = `Login OTP Code - ${appName}`;
            html = buildLoginOtpHtml(otp, recipientName);
        }

        mailJetConf(toEmail, recipientName, subject, html)
            .then((result) => {
                console.log(`Mailjet OTP email sent successfully to ${toEmail}`);
                return true;
            })
            .catch((err) => {
                console.error("Mailjet sendOtp Error:", err);
                return false;
            });
    } else if (isValidPhoneNumber(toEmail)) {
        const smsSubject = type === 'reset' ? `Reset Password OTP for ${appName} is ${otp}` : `Register OTP for ${appName} is ${otp}`;
        twilioConfig(toEmail, smsSubject).then(() => true).catch(() => false);
    }
};

const sendBookingConfirmationEmail = (toEmail, toName, bookingData) => {
    if (!validateEmail(toEmail)) return;
    const recipientName = toName || 'Valued Traveler';
    const bookingId = bookingData.id || bookingData.booking_id || `BK-${Date.now().toString().slice(-6)}`;
    const subject = `Booking Confirmation #${bookingId} - Delta Safari`;
    const html = buildBookingConfirmationHtml(bookingData, recipientName);

    mailJetConf(toEmail, recipientName, subject, html)
        .then(() => {
            console.log(`Mailjet booking confirmation email sent to ${toEmail}`);
        })
        .catch((err) => {
            console.error("Mailjet sendBookingConfirmationEmail Error:", err);
        });
};

const sendCustomEnquiryConfirmationEmail = (toEmail, toName, enquiryData) => {
    if (!validateEmail(toEmail)) return;
    const recipientName = toName || 'Valued Client';
    const subject = `Custom Package Request Received - Delta Safari`;
    const html = buildCustomEnquiryConfirmationHtml(enquiryData, recipientName);

    mailJetConf(toEmail, recipientName, subject, html)
        .then(() => {
            console.log(`Mailjet custom enquiry email sent to ${toEmail}`);
        })
        .catch((err) => {
            console.error("Mailjet sendCustomEnquiryConfirmationEmail Error:", err);
        });
};

function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function isValidPhoneNumber(phone) {
    const regex = /^\d{10}$/;
    return regex.test(phone);
}

function generateReferralCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {
    sendOtp,
    sendBookingConfirmationEmail,
    sendCustomEnquiryConfirmationEmail,
    validateEmail,
    isValidPhoneNumber,
    generateReferralCode
};