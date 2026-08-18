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

  return wrapInBaseTemplate("Booking Confirmation - Delta Safari", "Your Delta Safari booking confirmation", content);
};

/**
 * 5. Custom Tour / Lead Enquiry Confirmation Email Template
 */
const buildCustomEnquiryConfirmationHtml = (enquiry, userName = "Valued Client") => {
  const enquiryId = enquiry.id || enquiry.enquiry_id || `ENQ-${Date.now().toString().slice(-6)}`;
  const destination = enquiry.destination || enquiry.to_destination || "Sundarban Delta Safari";
  const duration = enquiry.duration || enquiry.travel_duration || "Custom Tour";
  const travelers = enquiry.travelers || enquiry.group_size || enquiry.adults || "1+ Person(s)";

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
        <span class="badge">Enquiry Received</span>
    </div>
    <h2 class="greeting" style="text-align: center;">Custom Tour Request Received!</h2>
    <p class="paragraph" style="text-align: center;">Hello <strong>${userName}</strong>, thank you for reaching out to Delta Safari! Our travel curator will design a customized itinerary for your trip.</p>
    
    <div class="detail-card">
        <div class="detail-row">
            <span class="detail-label">Enquiry Reference:</span>
            <span class="detail-value" style="color: ${BRAND_COLOR};">#${enquiryId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Target Destination:</span>
            <span class="detail-value">${destination}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tour Duration:</span>
            <span class="detail-value">${duration}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Group Size:</span>
            <span class="detail-value">${travelers}</span>
        </div>
    </div>

    <div style="background-color: ${BRAND_LIGHT_BG}; border: 1px solid ${BRAND_BORDER}; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-weight: 700; color: ${BRAND_COLOR}; font-size: 14px;">Personalized Quote Under Preparation</p>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #475569;">We will review your preferences and get in touch with you with a detailed itinerary and quotation within 24 hours.</p>
    </div>
  `;

  return wrapInBaseTemplate("Custom Holiday Enquiry - Delta Safari", "Your custom safari itinerary request", content);
};

/**
 * 6. Official Tax Invoice & Paid Booking Confirmation Email Template
 * Sent to BOTH Logged-in User and Admin upon Razorpay payment confirmation.
 */
const buildInvoiceEmailHtml = (booking, userName = "Valued Traveler", isForAdmin = false) => {
  const bookingId = booking.id || booking.bookings_id || `BK-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = booking.invoice_number || `DS-INV-${new Date().getFullYear()}-${String(bookingId).padStart(5, '0')}`;
  const packageName = booking.package_title || booking.title || booking.package_name || "Delta Safari Tour Package";
  const travelDate = booking.departure_date || booking.travel_date || "Scheduled Date";
  const durationText = booking.duration_days ? `${booking.duration_nights || Math.max(0, booking.duration_days - 1)} Nights / ${booking.duration_days} Days` : "Custom Duration";
  const travelersCount = booking.total_travelers || 1;
  const unitPrice = Number(booking.actual_price || (booking.total_cost / Math.max(1, travelersCount)) || 0);
  const totalAmount = Number(booking.total_cost || (unitPrice * travelersCount) || 0);
  const paymentId = booking.razorpay_payment_id || "Online Verified";
  const orderId = booking.razorpay_order_id || "N/A";
  const formattedDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const adminHeaderNotice = isForAdmin ? `
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 20px; text-align: center;">
        <span style="color: #065f46; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            🔔 Admin Operations Notice — New Paid Razorpay Booking
        </span>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Payment verified and deposited. Record is updated in Admin Panel.</p>
    </div>
  ` : '';

  const content = `
    ${adminHeaderNotice}
    <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            ✓ Payment Received & Booking Confirmed
        </span>
    </div>
    
    <h2 class="greeting" style="text-align: center; margin-bottom: 6px;">
        ${isForAdmin ? `New Online Booking Paid: #${bookingId}` : `Thank You for Your Booking, ${userName}!`}
    </h2>
    <p class="paragraph" style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 24px;">
        ${isForAdmin 
            ? `A direct payment has been processed via Razorpay. Below is the official tax invoice & reservation dossier.`
            : `Your holiday reservation with Delta Safari has been successfully paid and confirmed. Your official booking invoice is attached below.`
        }
    </p>

    <!-- INVOICE HEADER BOX -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: top; width: 50%;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Official Tax Invoice</div>
                    <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${invoiceNumber}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Booking Ref: <strong>#${bookingId}</strong></div>
                    <div style="font-size: 12px; color: #64748b;">Date: <strong>${formattedDate}</strong></div>
                </td>
                <td style="vertical-align: top; width: 50%; text-align: right;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Billed To</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px;">${booking.customer_name || userName}</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${booking.customer_phone || ''}</div>
                    <div style="font-size: 12px; color: #64748b;">${booking.customer_email || ''}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- TOUR PACKAGE & ITINERARY DOSSIER -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 800; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            Tour Reservation Details
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Package Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${packageName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Departure / Travel Date:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${travelDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${durationText}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Travelers Count:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${travelersCount} Person(s)</td>
            </tr>
        </table>
    </div>

    ${(() => {
        try {
            const rawTravelers = booking.travelers ? (typeof booking.travelers === 'string' ? JSON.parse(booking.travelers) : booking.travelers) : [];
            if (Array.isArray(rawTravelers) && rawTravelers.length > 0) {
                return `
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                        Registered Travelers Details
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background-color: #f1f5f9; text-align: left; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 8px 10px; color: #475569; font-weight: 700;">#</th>
                                <th style="padding: 8px 10px; color: #475569; font-weight: 700;">Full Name</th>
                                <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: center;">Age</th>
                                <th style="padding: 8px 10px; color: #475569; font-weight: 700; text-align: center;">Gender</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rawTravelers.map((t, idx) => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 8px 10px; color: #64748b; font-weight: 600;">${idx + 1}</td>
                                    <td style="padding: 8px 10px; color: #0f172a; font-weight: 600;">${t.name || ('Traveler ' + (idx + 1))}</td>
                                    <td style="padding: 8px 10px; text-align: center; color: #0f172a;">${t.age || '-'}</td>
                                    <td style="padding: 8px 10px; text-align: center; color: #0f172a;">${t.gender || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                `;
            }
        } catch (e) {}
        return '';
    })()}

    <!-- ITEMIZED BILLING BREAKDOWN TABLE -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                    <th style="padding: 10px 14px; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase;">Description</th>
                    <th style="padding: 10px 14px; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; text-align: center;">Qty</th>
                    <th style="padding: 10px 14px; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; text-align: right;">Rate</th>
                    <th style="padding: 10px 14px; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 14px; color: #0f172a; font-weight: 600;">
                        ${packageName}
                        <div style="font-size: 11px; color: #64748b; font-weight: 400; margin-top: 2px;">Includes Stay, Boat Safari, Permits, Gourmet Dining & Guide</div>
                    </td>
                    <td style="padding: 12px 14px; text-align: center; color: #0f172a;">${travelersCount}</td>
                    <td style="padding: 12px 14px; text-align: right; color: #0f172a;">₹${unitPrice.toLocaleString('en-IN')}</td>
                    <td style="padding: 12px 14px; text-align: right; color: #0f172a; font-weight: 700;">₹${totalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td colspan="3" style="padding: 10px 14px; text-align: right; color: #64748b; font-size: 12px;">Taxes & Service Fees (Included):</td>
                    <td style="padding: 10px 14px; text-align: right; color: #64748b; font-size: 12px;">₹0.00</td>
                </tr>
                <tr style="background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
                    <td colspan="3" style="padding: 12px 14px; text-align: right; font-weight: 800; color: #0f172a; font-size: 15px;">Total Paid:</td>
                    <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: ${BRAND_COLOR}; font-size: 17px;">
                        ₹${totalAmount.toLocaleString('en-IN')}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- PAYMENT GATEWAY & TRANSACTION INFO -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
                <td style="color: #166534; font-weight: 600;">Payment Gateway:</td>
                <td style="color: #166534; font-weight: 700; text-align: right;">Razorpay Online (UPI / Card / NetBanking)</td>
            </tr>
            <tr>
                <td style="color: #166534; font-weight: 600; padding-top: 4px;">Razorpay Payment ID:</td>
                <td style="color: #166534; font-family: monospace; font-weight: 700; text-align: right; padding-top: 4px;">${paymentId}</td>
            </tr>
            ${orderId !== 'N/A' ? `
            <tr>
                <td style="color: #166534; font-weight: 600; padding-top: 4px;">Razorpay Order ID:</td>
                <td style="color: #166534; font-family: monospace; font-weight: 600; text-align: right; padding-top: 4px;">${orderId}</td>
            </tr>` : ''}
            <tr>
                <td style="color: #166534; font-weight: 600; padding-top: 4px;">Payment Status:</td>
                <td style="color: #15803d; font-weight: 800; text-align: right; padding-top: 4px;">✓ COMPLETED & SETTLED</td>
            </tr>
        </table>
    </div>

    <!-- SUPPORT / CONTACT FOOTER -->
    <div style="background-color: ${BRAND_LIGHT_BG}; border: 1px solid ${BRAND_BORDER}; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-weight: 700; color: ${BRAND_COLOR}; font-size: 14px;">Delta Safari 24/7 Guest Support Desk</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">
            Have questions regarding your boat boarding, itinerary customization, or pickup transfers? Call us anytime at <strong>+91 98765 43210</strong> or email <a href="mailto:support@deltasafari.com" style="color: ${BRAND_COLOR};">support@deltasafari.com</a>.
        </p>
    </div>
  `;

  const emailSubject = isForAdmin 
    ? `[PAID BOOKING] #${bookingId} Invoice - ${packageName} (₹${totalAmount.toLocaleString('en-IN')})` 
    : `Invoice & Booking Confirmation #${bookingId} - ${packageName} | Delta Safari`;

  return wrapInBaseTemplate(emailSubject, `Booking Confirmation & Invoice #${invoiceNumber}`, content);
};

/**
 * 7. Admin-Only Booking Enquiry Request Email Template
 * Sent to ADMIN ONLY when a user (guest or logged-in) submits the standard booking inquiry form.
 */
const buildAdminBookingInquiryHtml = (booking) => {
  const bookingId = booking.id || booking.bookings_id || `INQ-${Date.now().toString().slice(-6)}`;
  const packageName = booking.package_title || booking.title || booking.package_name || "Delta Safari Tour Package";
  const travelDate = booking.departure_date || booking.travel_date || "Flexible / Not Specified";
  const travelersCount = booking.total_travelers || 1;
  const estimatedCost = booking.total_cost ? `₹${Number(booking.total_cost).toLocaleString('en-IN')}` : "Quote Request";
  const formattedDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            📩 New Booking Form Enquiry (Admin Copy)
        </span>
    </div>
    
    <h2 class="greeting" style="text-align: center; margin-bottom: 6px;">New Booking Reservation Request</h2>
    <p class="paragraph" style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 24px;">
        A customer has submitted a booking enquiry form on the website. Please review the details and reach out to confirm their reservation.
    </p>

    <!-- CLIENT DETAILS CARD -->
    <div class="detail-card">
        <div style="font-size: 12px; font-weight: 800; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            Client Information
        </div>
        <div class="detail-row">
            <span class="detail-label">Client Full Name:</span>
            <span class="detail-value">${booking.customer_name || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone Number:</span>
            <span class="detail-value" style="color: #0f172a;"><a href="tel:${booking.customer_phone}" style="color: #0f172a; text-decoration: none;">${booking.customer_phone || 'N/A'}</a></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email Address:</span>
            <span class="detail-value"><a href="mailto:${booking.customer_email}" style="color: ${BRAND_COLOR};">${booking.customer_email || 'N/A'}</a></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Submission Date:</span>
            <span class="detail-value">${formattedDate}</span>
        </div>
    </div>

    <!-- PACKAGE & RESERVATION PREFERENCES -->
    <div class="detail-card">
        <div style="font-size: 12px; font-weight: 800; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            Requested Package & Dates
        </div>
        <div class="detail-row">
            <span class="detail-label">Package Name:</span>
            <span class="detail-value">${packageName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Requested Departure Date:</span>
            <span class="detail-value">${travelDate}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Number of Travelers:</span>
            <span class="detail-value">${travelersCount} Person(s)</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Estimated Total Amount:</span>
            <span class="detail-value" style="color: ${BRAND_COLOR}; font-size: 15px;">${estimatedCost}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Status:</span>
            <span class="detail-value" style="color: #d97706;">Pending Confirmation (Inquiry Form)</span>
        </div>
    </div>

    ${booking.customer_comment ? `
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
        <strong style="color: #92400e; font-size: 12px; text-transform: uppercase; display: block; margin-bottom: 4px;">Customer Special Requests / Notes:</strong>
        <p style="margin: 0; font-size: 13px; color: #78350f;">${booking.customer_comment}</p>
    </div>` : ''}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #475569;">
            This booking inquiry is logged in the Admin Panel. Open your Admin dashboard to review, contact the client, or update reservation status.
        </p>
    </div>
  `;

  return wrapInBaseTemplate(`[NEW BOOKING INQUIRY] #${bookingId} - ${packageName} (${booking.customer_name})`, "New website booking inquiry request", content);
};

module.exports = {
  buildRegisterOtpHtml,
  buildForgotPasswordOtpHtml,
  buildLoginOtpHtml,
  buildBookingConfirmationHtml,
  buildCustomEnquiryConfirmationHtml,
  buildInvoiceEmailHtml,
  buildAdminBookingInquiryHtml
};

