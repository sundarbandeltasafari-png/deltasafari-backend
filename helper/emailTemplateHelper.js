/**
 * Delta Safari - Universal Mailjet Email Template Generator
 * Primary Accent Color: #2196f3 (Electric Blue) strictly used across all templates.
 */

const APP_NAME = process.env.APP_NAME || "Delta Safari";
const BRAND_COLOR = "#2196f3";
const BRAND_LIGHT_BG = "#e3f2fd";
const BRAND_BORDER = "#90caf9";

/**
 * Base Email Wrapper with Responsive Structure
 */
const wrapInBaseTemplate = (title, preheader, bodyContent) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .top-bar {
            height: 5px;
            background-color: ${BRAND_COLOR};
        }
        .header {
            padding: 28px 32px 20px 32px;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
        }
        .header-logo {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            text-decoration: none;
        }
        .header-logo span {
            color: ${BRAND_COLOR};
        }
        .body-content {
            padding: 32px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 16px;
        }
        .paragraph {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .otp-container {
            background-color: ${BRAND_LIGHT_BG};
            border: 1px solid ${BRAND_BORDER};
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 28px 0;
        }
        .otp-label {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${BRAND_COLOR};
            margin-bottom: 12px;
        }
        .otp-digits {
            display: inline-block;
            letter-spacing: 8px;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            background-color: ${BRAND_COLOR};
            padding: 10px 24px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
        }
        .detail-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin: 24px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 14px;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #64748b;
            font-weight: 500;
        }
        .detail-value {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
        }
        .badge {
            display: inline-block;
            background-color: ${BRAND_LIGHT_BG};
            color: ${BRAND_COLOR};
            border: 1px solid ${BRAND_BORDER};
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            text-transform: uppercase;
        }
        .footer {
            padding: 24px 32px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 13px;
            color: #94a3b8;
        }
        .footer a {
            color: ${BRAND_COLOR};
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div style="padding: 30px 12px; background-color: #f8fafc;">
        <div class="email-container">
            <div class="top-bar"></div>
            <div class="header">
                <div class="header-logo">
                    Delta <span>Safari</span>
                </div>
            </div>
            <div class="body-content">
                ${bodyContent}
            </div>
            <div class="footer">
                <p style="margin: 0 0 8px 0;">Need assistance? Contact our travel desk at <a href="mailto:support@deltasafari.com">support@deltasafari.com</a></p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * 1. Register OTP Email Template
 */
const buildRegisterOtpHtml = (otp, userName = "Valued Traveler") => {
  const content = `
    <h2 class="greeting">Verify Your Registration</h2>
    <p class="paragraph">Hello <strong>${userName}</strong>,</p>
    <p class="paragraph">Welcome to <strong>Delta Safari</strong> — your premier travel partner for exclusive tours, custom packages, and wildlife safaris!</p>
    <p class="paragraph">Please enter theOne-Time Password (OTP) below to complete your email verification and activate your account:</p>
    
    <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-digits">${otp}</div>
        <p style="font-size: 12px; color: #64748b; margin-top: 14px; margin-bottom: 0;">This OTP code is valid for 10 minutes. Do not share this code with anyone.</p>
    </div>

    <p class="paragraph">If you did not request this registration, please ignore this email.</p>
  `;
  return wrapInBaseTemplate("Register OTP - Delta Safari", "Verify your Delta Safari account", content);
};

/**
 * 2. Forgot / Reset Password OTP Email Template
 */
const buildForgotPasswordOtpHtml = (otp, userName = "Valued Traveler") => {
  const content = `
    <h2 class="greeting">Reset Your Password</h2>
    <p class="paragraph">Hello <strong>${userName}</strong>,</p>
    <p class="paragraph">We received a request to reset your password for your <strong>Delta Safari</strong> account.</p>
    <p class="paragraph">Use the One-Time Password (OTP) below to verify your identity and set a new password:</p>
    
    <div class="otp-container">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-digits">${otp}</div>
        <p style="font-size: 12px; color: #64748b; margin-top: 14px; margin-bottom: 0;">This OTP is valid for 10 minutes. If you did not initiate a password reset, please secure your account immediately.</p>
    </div>

    <p class="paragraph">If you didn't request a password reset, you can safely ignore this email.</p>
  `;
  return wrapInBaseTemplate("Reset Password - Delta Safari", "Your password reset OTP code", content);
};

/**
 * 3. Login OTP Email Template
 */
const buildLoginOtpHtml = (otp, userName = "Valued Traveler") => {
  const content = `
    <h2 class="greeting">Secure Login Code</h2>
    <p class="paragraph">Hello <strong>${userName}</strong>,</p>
    <p class="paragraph">Use the One-Time Password (OTP) below to complete your login to <strong>Delta Safari</strong>:</p>
    
    <div class="otp-container">
        <div class="otp-label">Login Verification Code</div>
        <div class="otp-digits">${otp}</div>
        <p style="font-size: 12px; color: #64748b; margin-top: 14px; margin-bottom: 0;">This OTP code will expire shortly. Do not share it with anyone.</p>
    </div>
  `;
  return wrapInBaseTemplate("Login Verification - Delta Safari", "Your Delta Safari login code", content);
};

/**
 * 4. Booking Confirmation Email Template
 */
const buildBookingConfirmationHtml = (booking, userName = "Valued Traveler") => {
  const bookingId = booking.id || booking.booking_id || `BK-${Date.now().toString().slice(-6)}`;
  const packageName = booking.package_name || booking.title || booking.destination || "Custom Safari Package";
  const travelDate = booking.travel_date || booking.departure_date || "Confirmed Schedule";
  const passengers = booking.passengers || booking.adults || booking.group_size || "1 Traveler";
  const amount = booking.amount || booking.price || booking.total_price ? `₹${Number(booking.amount || booking.price || booking.total_price).toLocaleString('en-IN')}` : "Custom Quote";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge">Booking Confirmed</span>
    </div>
    <h2 class="greeting" style="text-align: center;">Booking Request Received!</h2>
    <p class="paragraph" style="text-align: center;">Thank you <strong>${userName}</strong>! We have successfully received your tour booking request with Delta Safari.</p>
    
    <div class="detail-card">
        <div class="detail-row">
            <span class="detail-label">Booking Reference:</span>
            <span class="detail-value" style="color: ${BRAND_COLOR};">#${bookingId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Package Name:</span>
            <span class="detail-value">${packageName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Travel Date:</span>
            <span class="detail-value">${travelDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Travelers:</span>
            <span class="detail-value">${passengers}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value" style="color: ${BRAND_COLOR}; font-size: 16px;">${amount}</span>
        </div>
    </div>

    <div style="background-color: ${BRAND_LIGHT_BG}; border: 1px solid ${BRAND_BORDER}; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: ${BRAND_COLOR}; font-size: 14px;">Our Travel Operations Desk Will Connect With You Soon</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">A travel expert will reach out to confirm your itinerary and dispatch your final travel voucher.</p>
    </div>
  `;
  return wrapInBaseTemplate(`Booking Confirmation #${bookingId} - Delta Safari`, "Your Delta Safari booking confirmation", content);
};

/**
 * 5. Custom Package & Corporate Offsite Request Confirmation Template
 */
const buildCustomEnquiryConfirmationHtml = (enquiry, userName = "Valued Client") => {
  const destination = enquiry.destination || "Custom Destination";
  const travelDate = enquiry.travel_date || enquiry.departure_date || "Flexible Schedule";
  const duration = enquiry.duration_days ? `${enquiry.duration_days} Days / ${enquiry.duration_nights || 0} Nights` : "Custom Duration";
  const groupSize = enquiry.group_size || (enquiry.total_employees ? `${enquiry.total_employees} Employees` : `${enquiry.adults_count || 1} Travelers`);

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge">Request Submitted</span>
    </div>
    <h2 class="greeting" style="text-align: center;">Custom Package Enquiry Received</h2>
    <p class="paragraph" style="text-align: center;">Thank you <strong>${userName}</strong>! We have received your customized tour / corporate offsite request for <strong>${destination}</strong>.</p>
    
    <div class="detail-card">
        <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">${destination}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Travel Date:</span>
            <span class="detail-value">${travelDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${duration}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Group Size:</span>
            <span class="detail-value">${groupSize}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="color: ${BRAND_COLOR};">Quote Under Review</span>
        </div>
    </div>

    <div style="background-color: ${BRAND_LIGHT_BG}; border: 1px solid ${BRAND_BORDER}; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 700; color: ${BRAND_COLOR}; font-size: 14px;">Our Dedicated Travel Desk Is Reviewing Your Request</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">Our travel specialists will reach out via phone or email shortly to share tailored itinerary options and custom pricing.</p>
    </div>
  `;
  return wrapInBaseTemplate("Custom Package Request - Delta Safari", "Your custom package request confirmation", content);
};

module.exports = {
  buildRegisterOtpHtml,
  buildForgotPasswordOtpHtml,
  buildLoginOtpHtml,
  buildBookingConfirmationHtml,
  buildCustomEnquiryConfirmationHtml
};
