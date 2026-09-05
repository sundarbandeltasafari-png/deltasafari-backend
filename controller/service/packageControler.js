const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const md5 = require('md5');
const { 
    getHomePackagesModel, 
    getDestinationsModel, 
    getAllPackageItinerariesModel, 
    getAllPackagePoliciesModel, 
    getParticularPackageModel, 
    createBookingsModel, 
    getBookingByIdModel,
    getBookingByRazorpayOrderIdModel,
    updateBookingModel,
    getFilteredPackagesModel, 
    getCitiesModel, 
    getAllCitiesModel, 
    getAllPackageTypesModel, 
    searchAllModel, 
    getDiscountedPackagesModel 
} = require('../../model/service/packageModel');
const { urlDecode } = require('../../helper/urlHelper');
const { getAllPackageAssetsModel } = require('../../model/admin/package/adminPackageModel');
const { getPackageReferenceHotelsModel } = require('../../model/admin/service/adminHotelModel');
const { sendPaidBookingInvoiceDualEmail, sendAdminBookingInquiryEmail } = require('../../helper/serviceHelper');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RQWjJm9q5lEiA8',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'XwAWgPdeymk9XLHqndmSD27c'
});

const getAllPackageType = asyncHandler(async (req, res, next) => {
    try {
        const packageTypes = await getAllPackageTypesModel(req?.body ? {...req?.body, status: 1} : { status: 1 });
        return res.status(200).json({ status: true, msg: 'All PackageTypes..', packageTypes: packageTypes })
    } catch (error) {
        next(error)
    }
})

const getHomePackages = asyncHandler(async (req, res) => {
    try {
        const domestic = await getHomePackagesModel({ pkg_type: 1 });
        const international = await getHomePackagesModel({ pkg_type: 2 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', domestic: domestic, international: international })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getDestinations = asyncHandler(async (req, res) => {
    try {
        const condition = req?.body?.condition || (req?.query && Object.keys(req.query).length > 0 ? req.query : undefined) || (req?.body && Object.keys(req.body).length > 0 ? req.body : undefined);
        const destinations = await getDestinationsModel(condition);
        return res.status(200).json({ status: true, msg: 'All destinations...', destinations: destinations })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getCorporateDestinations = asyncHandler(async (req, res) => {
    try {
        let destinations = await getDestinationsModel({ show_in_corporate: 1 });
        if (!destinations || destinations.length === 0) {
            destinations = await getDestinationsModel({ top_destination: 1 });
            if (!destinations || destinations.length === 0) {
                destinations = await getDestinationsModel();
            }
        }
        destinations = (destinations || []).map((dest) => ({
            ...dest,
            image: dest?.image ? dest.image.replace(/\\/g, '/') : null
        }));
        return res.status(200).json({ status: true, msg: 'Corporate destinations', destinations: destinations });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
})

const getCities = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(401).json({ status: false, msg: 'Please add condition' })
        }
        const cities = await getCitiesModel(req?.body?.condition);
        return res.status(200).json({ status: true, msg: 'All cities...', cities: cities })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getAllCities = asyncHandler(async (req, res) => {
    try {
        const condition = req?.body?.condition || (req?.body && Object.keys(req.body).length > 0 ? req.body : undefined);
        const cities = await getAllCitiesModel(condition);
        return res.status(200).json({ status: true, msg: 'All cities...', cities: cities })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularPackage = asyncHandler(async (req, res, next) => {
    try {
        const packageId = req.query?.id && urlDecode(req?.query?.id);
        const slug = req.query?.slug;

        let packageData = [];
        if (slug) {
            packageData = await getParticularPackageModel({ "packages_master.slug": slug });
            if ((!packageData || packageData.length === 0) && slug) {
                const decodedSlug = decodeURIComponent(slug);
                if (decodedSlug !== slug) {
                    packageData = await getParticularPackageModel({ "packages_master.slug": decodedSlug });
                }
            }
        }

        if ((!packageData || packageData.length === 0) && packageId) {
            packageData = await getParticularPackageModel({ "packages_master.id": packageId });
        }

        const package = packageData && packageData.length > 0 ? packageData[0] : null;
        if (!package) {
            return res.status(400).json({ status: false, msg: 'There is no package found!' });
        }
        package.itineraries = await getAllPackageItinerariesModel({ package_id: package?.id });
        package.assets = await getAllPackageAssetsModel({ package_id: package?.id });
        package.policies = await getAllPackagePoliciesModel({ package_id: package?.id });

        // Fetch Reference Hotels
        const rawRefHotels = await getPackageReferenceHotelsModel(package?.id);
        package.reference_hotels = (rawRefHotels || []).map(hotel => {
            let amenities = [];
            try {
                amenities = typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : (hotel.amenities || []);
            } catch (e) {
                amenities = hotel.amenities ? String(hotel.amenities).split(',').map(s => s.trim()) : [];
            }

            let images = [];
            try {
                images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : (hotel.images || []);
            } catch (e) {
                images = [];
            }

            let roomTypes = [];
            try {
                roomTypes = typeof hotel.room_types === 'string' ? JSON.parse(hotel.room_types) : (hotel.room_types || []);
            } catch (e) {
                roomTypes = [];
            }

            return {
                ...hotel,
                main_image: hotel.main_image ? hotel.main_image.replace(/\\/g, '/') : null,
                images: (images || []).map(img => img ? img.replace(/\\/g, '/') : img),
                amenities: amenities,
                room_types: roomTypes
            };
        });

        return res.status(200).json({ status: true, msg: 'Here is your package, book now!', package: package });
    } catch (error) {
        next(error);
    }
});

/**
 * 1. Create Razorpay Order for Direct Package Booking (Only when Logged In)
 */
const createPackageRazorpayOrder = asyncHandler(async (req, res) => {
    try {
        const { package_id, total_travelers, departure_date, customer_name, customer_email, customer_phone, customer_comment, travelers } = req.body;

        if (!package_id) {
            return res.status(400).json({ status: false, msg: 'Package ID is required.' });
        }

        const packageData = await getParticularPackageModel({ "packages_master.id": package_id });
        const pkg = packageData && packageData.length > 0 ? packageData[0] : null;
        if (!pkg) {
            return res.status(404).json({ status: false, msg: 'Tour package not found.' });
        }

        const travelersCount = Math.max(1, parseInt(total_travelers) || 1);
        const isAgent = Number(req.user?.user_type) === 3;
        const unitPrice = isAgent && pkg.agent_actual_price ? Number(pkg.agent_actual_price) : Number(pkg.actual_price || pkg.price || 0);
        const totalAmount = unitPrice * travelersCount;

        if (totalAmount <= 0) {
            return res.status(400).json({ status: false, msg: 'Invalid booking amount. Please check package pricing.' });
        }

        const userId = req.user?.id || req.body?.user_id || null;
        const receiptId = `bk_${Date.now().toString().slice(-8)}`;

        const orderOptions = {
            amount: Math.round(totalAmount * 100), // amount in paise
            currency: "INR",
            receipt: receiptId,
            notes: {
                package_id: String(pkg.id),
                package_title: String(pkg.title || '').substring(0, 40),
                user_id: userId ? String(userId) : '',
                customer_name: customer_name || '',
                customer_email: customer_email || '',
                customer_phone: customer_phone || '',
                departure_date: departure_date || '',
                total_travelers: String(travelersCount)
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Pre-insert pending booking into database
        const bookingPayload = {
            user_id: userId,
            package_id: pkg.id,
            customer_name: customer_name || (req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() : 'Valued Traveler'),
            customer_email: customer_email || req.user?.email || null,
            customer_phone: customer_phone || req.user?.phone || null,
            customer_comment: customer_comment || null,
            total_travelers: travelersCount,
            travelers: travelers ? (typeof travelers === 'string' ? travelers : JSON.stringify(travelers)) : null,
            departure_date: departure_date || null,
            actual_price: unitPrice,
            total_cost: totalAmount,
            booking_type: 'DIRECT_RAZORPAY',
            payment_method: 'RAZORPAY',
            payment_status: 'PENDING',
            razorpay_order_id: razorpayOrder.id,
            booking_status: 1
        };

        const result = await createBookingsModel(bookingPayload);
        const bookingId = result?.insertId;

        return res.status(200).json({
            status: true,
            msg: 'Razorpay order generated successfully.',
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt
            },
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RQWjJm9q5lEiA8',
            booking_id: bookingId,
            package_title: pkg.title,
            total_amount: totalAmount
        });
    } catch (error) {
        console.error("createPackageRazorpayOrder Error:", error);
        return res.status(500).json({ status: false, msg: error.message || 'Failed to initialize payment gateway order.' });
    }
});

/**
 * 2. Verify Razorpay Payment & Confirm Booking (Dispatches Invoice to BOTH User and Admin)
 */
const verifyPackageRazorpayPayment = asyncHandler(async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: false, msg: 'Missing required Razorpay payment verification parameters.' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'XwAWgPdeymk9XLHqndmSD27c')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: false, msg: 'Invalid payment signature! Payment verification failed.' });
        }

        // Signature verified! Retrieve booking
        let booking = null;
        if (booking_id) {
            booking = await getBookingByIdModel(booking_id);
        }
        if (!booking && razorpay_order_id) {
            booking = await getBookingByRazorpayOrderIdModel(razorpay_order_id);
        }

        if (!booking) {
            return res.status(404).json({ status: false, msg: 'Booking record not found for this transaction.' });
        }

        const targetBookingId = booking.bookings_id || booking.id;
        const invoiceNumber = booking.invoice_number || `DS-INV-${new Date().getFullYear()}-${String(targetBookingId).padStart(5, '0')}`;

        const updateData = {
            payment_status: 'PAID',
            booking_status: 2, // Confirmed & Booked
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            invoice_number: invoiceNumber
        };

        await updateBookingModel(updateData, targetBookingId);

        // Fetch refreshed booking with all package details for invoice email
        const updatedBooking = await getBookingByIdModel(targetBookingId);

        // Send Invoice with booking details email to BOTH Logged-in User and Admin
        const customerEmail = updatedBooking.customer_email || updatedBooking.user_account_email;
        const customerName = updatedBooking.customer_name || (updatedBooking.first_name ? `${updatedBooking.first_name} ${updatedBooking.last_name || ''}`.trim() : 'Valued Traveler');

        if (Number(booking.email_sent_to_user) !== 1) {
            sendPaidBookingInvoiceDualEmail(customerEmail, customerName, updatedBooking);
            await updateBookingModel({ email_sent_to_user: 1, email_sent_to_admin: 1 }, targetBookingId);
        }

        // Process referral commission if eligible
        const customerUserId = updatedBooking.user_id;
        const packageId = updatedBooking.package_id;
        if (customerUserId && packageId) {
            try {
                const { processReferralCommission } = require('../user/userController');
                processReferralCommission(targetBookingId, customerUserId, packageId).catch((err) => {
                    console.error("Error in processReferralCommission:", err);
                });
            } catch (refErr) {
                console.error("Referral process error:", refErr);
            }
        }

        return res.status(200).json({
            status: true,
            msg: 'Payment verified and booking confirmed successfully! Official invoice has been dispatched to your email.',
            booking_id: targetBookingId,
            invoice_number: invoiceNumber,
            booking: updatedBooking
        });
    } catch (error) {
        console.error("verifyPackageRazorpayPayment Error:", error);
        return res.status(500).json({ status: false, msg: error.message || 'Payment verification failed.' });
    }
});

/**
 * 3. Razorpay Webhook Handler for automated asynchronous payment confirmation
 */
const razorpayWebhook = asyncHandler(async (req, res) => {
    try {
        const secretList = [
            process.env.RAZORPAY_WEBHOOK_SECRET,
            process.env.RAZORPAY_KEY_SECRET,
            'R2aj8d4H3KwkKjkNO12FQ7B2',
            'XwAWgPdeymk9XLHqndmSD27c'
        ].filter(Boolean);

        const signature = req.headers['x-razorpay-signature'];

        // Validate webhook signature if header is provided
        if (signature) {
            const rawBodyPayload = req.rawBody 
                ? req.rawBody.toString('utf8') 
                : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

            let isValidSignature = false;
            for (const sec of secretList) {
                const expectedSig = crypto
                    .createHmac('sha256', sec)
                    .update(rawBodyPayload)
                    .digest('hex');
                if (signature === expectedSig) {
                    isValidSignature = true;
                    break;
                }
            }

            if (!isValidSignature) {
                console.warn("[Razorpay Webhook] Signature verification mismatch (proceeding with caution).");
            } else {
                console.log("[Razorpay Webhook] Webhook signature verified successfully.");
            }
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        console.log(`[Razorpay Webhook Received] Event: ${event?.event}`);

        if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
            const paymentEntity = event.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
            const paymentId = paymentEntity?.id;

            // 1. Check Package Bookings
            if (orderId) {
                const booking = await getBookingByRazorpayOrderIdModel(orderId);
                if (booking && booking.payment_status !== 'PAID') {
                    const targetBookingId = booking.bookings_id || booking.id;
                    const invoiceNumber = booking.invoice_number || `DS-INV-${new Date().getFullYear()}-${String(targetBookingId).padStart(5, '0')}`;

                    await updateBookingModel({
                        payment_status: 'PAID',
                        booking_status: 2,
                        razorpay_payment_id: paymentId || booking.razorpay_payment_id,
                        invoice_number: invoiceNumber
                    }, targetBookingId);

                    const updatedBooking = await getBookingByIdModel(targetBookingId);

                    if (Number(booking.email_sent_to_user) !== 1) {
                        const customerEmail = updatedBooking.customer_email || updatedBooking.user_account_email;
                        const customerName = updatedBooking.customer_name || 'Valued Traveler';
                        sendPaidBookingInvoiceDualEmail(customerEmail, customerName, updatedBooking);
                        await updateBookingModel({ email_sent_to_user: 1, email_sent_to_admin: 1 }, targetBookingId);
                    }

                    // Process referral if applicable
                    if (updatedBooking.user_id && updatedBooking.package_id) {
                        try {
                            const { processReferralCommission } = require('../user/userController');
                            processReferralCommission(targetBookingId, updatedBooking.user_id, updatedBooking.package_id).catch(console.error);
                        } catch (e) {}
                    }
                }
            }

            // 2. CRM Invoice Payment Link Auto-Reconciliation
            const paymentLinkEntity = event.payload?.payment_link?.entity;
            const paymentLinkId = paymentLinkEntity?.id || paymentEntity?.payment_link_id;
            const notes = paymentLinkEntity?.notes || paymentEntity?.notes || {};

            if (paymentLinkId || notes?.invoice_no || notes?.invoice_id) {
                try {
                    const { autoSettleInvoiceFromRazorpay } = require('../admin/invoiceModel');
                    const paidAmt = paymentEntity?.amount || paymentLinkEntity?.amount_paid;
                    autoSettleInvoiceFromRazorpay({
                        paymentLinkId: paymentLinkId || paymentLinkEntity?.id,
                        paymentId: paymentId || paymentEntity?.id,
                        amount: paidAmt,
                        invoiceNo: notes?.invoice_no,
                        notes,
                        rawEvent: event.event
                    }).then((res) => {
                        if (res?.success) {
                            console.log(`[Razorpay Webhook] Successfully auto-settled CRM Invoice #${res.invoice_no} (Status: ${res.new_status})`);
                        }
                    }).catch(console.error);
                } catch (settleErr) {
                    console.error('[Razorpay Webhook] Error invoking autoSettleInvoiceFromRazorpay:', settleErr);
                }
            }
        }

        // 3. Handle direct payment_link.paid event
        if (event?.event === 'payment_link.paid') {
            const plEntity = event.payload?.payment_link?.entity;
            const payEntity = event.payload?.payment?.entity;
            const notes = plEntity?.notes || payEntity?.notes || {};
            try {
                const { autoSettleInvoiceFromRazorpay } = require('../admin/invoiceModel');
                autoSettleInvoiceFromRazorpay({
                    paymentLinkId: plEntity?.id,
                    paymentId: payEntity?.id,
                    amount: plEntity?.amount_paid || payEntity?.amount,
                    invoiceNo: notes?.invoice_no,
                    notes,
                    rawEvent: 'payment_link.paid'
                }).then((res) => {
                    if (res?.success) {
                        console.log(`[Razorpay Webhook] Auto-settled via payment_link.paid: Invoice #${res.invoice_no}`);
                    }
                }).catch(console.error);
            } catch (plErr) {
                console.error('[Razorpay Webhook] Error in payment_link.paid handler:', plErr);
            }
        }

        return res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error("razorpayWebhook Error:", error);
        return res.status(200).json({ status: 'error', msg: error.message });
    }
});

/**
 * 4. Create Booking Inquiry Form Request (For non-logged in users OR logged-in users submitting enquiry form)
 * Dispatches Booking Details email to ADMIN ONLY.
 */
const createBookings = asyncHandler(async (req, res) => {
    try {
        if (!req?.body) {
            return res.status(400).json({ status: false, msg: 'Please add valid details for booking' });
        }

        const packageId = req.body?.package_id || req.body?.packageId;
        let pkg = null;
        if (packageId) {
            const packageData = await getParticularPackageModel({ "packages_master.id": packageId });
            pkg = packageData && packageData.length > 0 ? packageData[0] : null;
        }

        const travelersCount = Math.max(1, parseInt(req.body?.total_travelers || req.body?.adults_count || req.body?.adults || 1));
        const unitPrice = Number(req.body?.actual_price || pkg?.actual_price || pkg?.price || 0);
        const totalCost = Number(req.body?.total_cost || (unitPrice * travelersCount) || 0);

        const bookingPayload = {
            user_id: req.user?.id || req.body?.user_id || null,
            package_id: packageId,
            customer_name: req.body?.customer_name || req.body?.name || req.body?.full_name || 'Guest Traveler',
            customer_email: req.body?.customer_email || req.body?.email || null,
            customer_phone: req.body?.customer_phone || req.body?.phone || null,
            customer_comment: req.body?.customer_comment || req.body?.comment || req.body?.message || null,
            total_travelers: travelersCount,
            travelers: req.body?.travelers ? (typeof req.body.travelers === 'string' ? req.body.travelers : JSON.stringify(req.body.travelers)) : null,
            departure_date: req.body?.departure_date || req.body?.travel_date || null,
            actual_price: unitPrice,
            total_cost: totalCost,
            booking_type: req.body?.booking_type || 'ENQUIRY_FORM',
            payment_method: req.body?.payment_method || 'INQUIRY',
            payment_status: 'PENDING',
            booking_status: 1
        };

        const bookingResult = await createBookingsModel(bookingPayload);
        const bookingId = bookingResult?.insertId;

        // Fetch full booking details with package info for admin notification
        let fullBooking = { ...bookingPayload, id: bookingId, package_title: pkg?.title };
        if (bookingId) {
            const fetched = await getBookingByIdModel(bookingId);
            if (fetched) fullBooking = fetched;
        }

        // If user submitted booking form -> Booking details email should come to ADMIN ONLY
        sendAdminBookingInquiryEmail(fullBooking);

        return res.status(200).json({
            status: true,
            msg: 'Booking request registered successfully! Our travel team will contact you shortly.',
            booking: fullBooking
        });
    } catch (error) {
        console.error("createBookings Error:", error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const getFilteredPackages = asyncHandler(async (req, res, next) => {
    try {
        const destination = req.query?.destination || req.body?.destination;
        const name = req.query?.name || req.body?.name;
        const category = req.query?.category || req.body?.category;
        const city = req.query?.city || req.body?.city;
        const lastId = req.query?.lastId || req.body?.lastId;

        const filters = {};
        if (destination && destination.toString().trim() !== '') filters.destination = destination.toString().trim();
        if (name && name.toString().trim() !== '') filters.name = name.toString().trim();
        if (category && category.toString().trim() !== '') filters.category = category.toString().trim();
        if (city && city.toString().trim() !== '') filters.city = city.toString().trim();
        if (lastId && lastId.toString().trim() !== '') filters.lastId = lastId.toString().trim();

        const packages = await getFilteredPackagesModel(filters);
        return res.status(200).json({ status: true, msg: 'Filtered packages fetched successfully.', packages: packages })
    } catch (error) {
        next(error)
    }
})

const searchAll = asyncHandler(async (req, res, next) => {
    try {
        const search = req?.query?.search || req?.query?.q || req?.body?.search || req?.body?.q || req?.body?.searchData || '';
        
        if (!search || search.toString().trim() === '') {
            return res.status(200).json({ 
                status: true, 
                msg: 'Search query is empty.', 
                results: [],
                groupedResults: { cities: [], zones: [], packages: [] }
            });
        }

        const results = await searchAllModel(search.toString().trim());
        
        const groupedResults = {
            cities: results.filter(item => item.type === 'city'),
            zones: results.filter(item => item.type === 'zone'),
            packages: results.filter(item => item.type === 'package')
        };

        return res.status(200).json({ 
            status: true, 
            msg: 'Search results fetched successfully.', 
            results: results,
            groupedResults: groupedResults 
        });
    } catch (error) {
        next(error);
    }
});

const getDiscountedPackages = asyncHandler(async (req, res, next) => {
    try {
        const limit = req.query?.limit || req.body?.limit || 6;
        const packages = await getDiscountedPackagesModel(limit);
        return res.status(200).json({ status: true, msg: 'Discounted packages fetched successfully.', packages: packages });
    } catch (error) {
        next(error);
    }
});

module.exports = { 
    getHomePackages, 
    getDestinations, 
    getCorporateDestinations,
    getParticularPackage, 
    createBookings, 
    createPackageRazorpayOrder,
    verifyPackageRazorpayPayment,
    razorpayWebhook,
    getFilteredPackages, 
    getCities, 
    getAllCities, 
    getAllPackageType, 
    searchAll, 
    getDiscountedPackages 
};