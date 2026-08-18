const mailJetConf = require('../MailConfig');
const twilioConfig = require('../twilioConfig');
const {
    buildRegisterOtpHtml,
    buildForgotPasswordOtpHtml,
    buildLoginOtpHtml,
    buildBookingConfirmationHtml,
    buildCustomEnquiryConfirmationHtml,
    buildInvoiceEmailHtml,
    buildAdminBookingInquiryHtml
} = require('./emailTemplateHelper');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.MJ_FROM_EMAIL || 'sundarban.deltasafari@gmail.com';
const ADMIN_NAME = 'Delta Safari Operations';

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
                console.log(`[Email] OTP email sent successfully to ${toEmail}`);
                return true;
            })
            .catch((err) => {
                console.error("[Email Error] sendOtp Error:", err?.message || err);
                return false;
            });
    } else if (isValidPhoneNumber(toEmail)) {
        const smsSubject = type === 'reset' ? `Reset Password OTP for ${appName} is ${otp}` : `Register OTP for ${appName} is ${otp}`;
        twilioConfig(toEmail, smsSubject).then(() => true).catch(() => false);
    }
};

/**
 * Sends official booking invoice to BOTH Logged-in User and Admin upon Razorpay payment confirmation.
 */
const sendPaidBookingInvoiceDualEmail = (userEmail, userName, bookingData) => {
    const bookingId = bookingData.id || bookingData.bookings_id || `BK-${Date.now().toString().slice(-6)}`;
    const packageName = bookingData.package_title || bookingData.title || bookingData.package_name || "Delta Safari Tour Package";
    const totalAmount = Number(bookingData.total_cost || 0);
    const recipientName = userName || bookingData.customer_name || 'Valued Traveler';

    // 1. Send Invoice to Logged-in User
    if (validateEmail(userEmail)) {
        const userSubject = `Invoice & Booking Confirmation #${bookingId} - ${packageName} | Delta Safari`;
        const userHtml = buildInvoiceEmailHtml(bookingData, recipientName, false);

        mailJetConf(userEmail, recipientName, userSubject, userHtml)
            .then(() => {
                console.log(`[Email] Invoice sent to User (${userEmail}) for Booking #${bookingId}`);
            })
            .catch((err) => {
                console.error(`[Email Error] Failed to send invoice to user (${userEmail}):`, err?.message || err);
            });
    }

    // 2. Send Invoice Copy to Admin
    if (validateEmail(ADMIN_EMAIL)) {
        const adminSubject = `[PAID BOOKING] #${bookingId} Invoice - ${packageName} (₹${totalAmount.toLocaleString('en-IN')})`;
        const adminHtml = buildInvoiceEmailHtml(bookingData, recipientName, true);

        mailJetConf(ADMIN_EMAIL, ADMIN_NAME, adminSubject, adminHtml)
            .then(() => {
                console.log(`[Email] Invoice copy sent to Admin (${ADMIN_EMAIL}) for Booking #${bookingId}`);
            })
            .catch((err) => {
                console.error(`[Email Error] Failed to send invoice copy to admin (${ADMIN_EMAIL}):`, err?.message || err);
            });
    }
};

/**
 * Sends booking details email to ADMIN ONLY when someone submits the booking form (inquiry request).
 */
const sendAdminBookingInquiryEmail = (bookingData) => {
    if (!validateEmail(ADMIN_EMAIL)) return;
    const bookingId = bookingData.id || bookingData.bookings_id || `INQ-${Date.now().toString().slice(-6)}`;
    const packageName = bookingData.package_title || bookingData.title || bookingData.package_name || "Delta Safari Tour Package";
    const clientName = bookingData.customer_name || 'Prospective Traveler';
    const subject = `[NEW BOOKING INQUIRY] #${bookingId} - ${packageName} (${clientName})`;
    const html = buildAdminBookingInquiryHtml(bookingData);

    mailJetConf(ADMIN_EMAIL, ADMIN_NAME, subject, html)
        .then(() => {
            console.log(`[Email] Booking form enquiry dispatched to Admin (${ADMIN_EMAIL}) for Request #${bookingId}`);
        })
        .catch((err) => {
            console.error(`[Email Error] Failed to send booking enquiry to admin:`, err?.message || err);
        });
};

const sendBookingConfirmationEmail = (toEmail, toName, bookingData) => {
    if (!validateEmail(toEmail)) return;
    const recipientName = toName || 'Valued Traveler';
    const bookingId = bookingData.id || bookingData.booking_id || `BK-${Date.now().toString().slice(-6)}`;
    const subject = `Booking Confirmation #${bookingId} - Delta Safari`;
    const html = buildBookingConfirmationHtml(bookingData, recipientName);

    mailJetConf(toEmail, recipientName, subject, html)
        .then(() => {
            console.log(`[Email] Booking confirmation email sent to ${toEmail}`);
        })
        .catch((err) => {
            console.error("[Email Error] sendBookingConfirmationEmail Error:", err?.message || err);
        });
};

const sendCustomEnquiryConfirmationEmail = (toEmail, toName, enquiryData) => {
    if (!validateEmail(toEmail)) return;
    const recipientName = toName || 'Valued Client';
    const subject = `Custom Package Request Received - Delta Safari`;
    const html = buildCustomEnquiryConfirmationHtml(enquiryData, recipientName);

    mailJetConf(toEmail, recipientName, subject, html)
        .then(() => {
            console.log(`[Email] Custom enquiry email sent to ${toEmail}`);
        })
        .catch((err) => {
            console.error("[Email Error] sendCustomEnquiryConfirmationEmail Error:", err?.message || err);
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
    sendPaidBookingInvoiceDualEmail,
    sendAdminBookingInquiryEmail,
    sendBookingConfirmationEmail,
    sendCustomEnquiryConfirmationEmail,
    validateEmail,
    isValidPhoneNumber,
    generateReferralCode
};