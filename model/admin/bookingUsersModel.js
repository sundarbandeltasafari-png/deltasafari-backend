const connection = require('../../Connection');

/**
 * Normalizes phone numbers to standard 10-digit format for grouping
 */
function normalizePhone(rawPhone) {
    if (!rawPhone) return '';
    const digits = String(rawPhone).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Normalizes user display name
 */
function normalizeName(name) {
    if (!name) return 'Guest Traveler';
    return String(name).trim();
}

/**
 * Fetch and aggregate all booking users across:
 * 1. crm_invoices (CRM Invoices & billing)
 * 2. bookings (Website package reservations)
 * 3. crm_lead_followups (Converted CRM leads)
 */
function getBookingUsersListModel({
    page = 1,
    limit = 20,
    search = '',
    payment_status = 'all' // 'all', 'paid', 'due', 'pending'
} = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Fetch Invoices
            const invoicesQuery = `
                SELECT 
                    i.*,
                    DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS formatted_invoice_date,
                    DATE_FORMAT(i.created_at, '%Y-%m-%d %H:%i:%s') AS formatted_created_at,
                    CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS created_by_name,
                    CONCAT(v.first_name, ' ', COALESCE(v.last_name, '')) AS verified_by_name
                FROM crm_invoices i
                LEFT JOIN user_master u ON u.id = i.created_by
                LEFT JOIN user_master v ON v.id = i.payment_verified_by
                ORDER BY i.id DESC
            `;
            const invoices = await new Promise((res, rej) => {
                connection.query(invoicesQuery, (err, rows) => err ? rej(err) : res(rows || []));
            });

            // 2. Fetch Reservations / Bookings
            const bookingsQuery = `
                SELECT 
                    b.*,
                    p.title AS package_title,
                    p.slug AS package_slug,
                    DATE_FORMAT(b.departure_date, '%Y-%m-%d') AS formatted_departure_date,
                    DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS formatted_created_at
                FROM bookings b
                LEFT JOIN packages_master p ON p.id = b.package_id
                ORDER BY b.id DESC
            `;
            const bookings = await new Promise((res, rej) => {
                connection.query(bookingsQuery, (err, rows) => err ? rej(err) : res(rows || []));
            });

            // 3. Fetch Converted Leads
            const leadsQuery = `
                SELECT 
                    l.*,
                    DATE_FORMAT(l.travel_date, '%Y-%m-%d') AS formatted_travel_date,
                    DATE_FORMAT(l.converted_at, '%Y-%m-%d %H:%i:%s') AS formatted_converted_at,
                    CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) AS assigned_agent_name
                FROM crm_lead_followups l
                LEFT JOIN user_master u ON u.id = l.converted_by
                WHERE l.is_converted = 1
                ORDER BY l.id DESC
            `;
            const convertedLeads = await new Promise((res, rej) => {
                connection.query(leadsQuery, (err, rows) => err ? rej(err) : res(rows || []));
            });

            // 4. Group by normalized customer identifier (phone or email)
            const userMap = new Map();

            // Helper to get or initialize user object
            const getUserRecord = (rawPhone, rawEmail, rawName, address = '') => {
                const normPhone = normalizePhone(rawPhone);
                const normEmail = (rawEmail || '').toLowerCase().trim();
                const key = normPhone || normEmail || `guest-${Date.now()}-${Math.random()}`;

                if (!userMap.has(key)) {
                    userMap.set(key, {
                        key,
                        customer_name: normalizeName(rawName),
                        customer_phone: rawPhone || '',
                        normalized_phone: normPhone,
                        customer_email: rawEmail || '',
                        customer_address: address || 'West Bengal',
                        total_bookings: 0,
                        total_spent: 0,
                        total_paid: 0,
                        total_due: 0,
                        packages: new Set(),
                        last_booking_date: null,
                        next_travel_date: null,
                        booking_history: []
                    });
                }

                const rec = userMap.get(key);
                if ((!rec.customer_name || rec.customer_name === 'Guest Traveler') && rawName) {
                    rec.customer_name = normalizeName(rawName);
                }
                if (!rec.customer_email && rawEmail) {
                    rec.customer_email = rawEmail;
                }
                if ((!rec.customer_address || rec.customer_address === 'West Bengal') && address && address !== 'West Bengal') {
                    rec.customer_address = address;
                }
                return rec;
            };

            // Process Invoices
            invoices.forEach(inv => {
                const user = getUserRecord(inv.customer_phone, inv.customer_email, inv.customer_name, inv.customer_address);
                user.total_bookings += 1;

                const billed = (parseFloat(inv.subtotal) || 0) + (parseFloat(inv.gst_amount) || 0) - (parseFloat(inv.discount_amount) || 0);
                const advance = parseFloat(inv.advance_received) || 0;
                const due = parseFloat(inv.total_due_amount) || 0;

                user.total_spent += billed;
                user.total_paid += advance;
                user.total_due += due;

                const pkgName = inv.package_name || (inv.items_json ? (typeof inv.items_json === 'string' ? JSON.parse(inv.items_json)[0]?.description : inv.items_json[0]?.description) : null) || 'Sundarban Tour Package';
                if (pkgName) user.packages.add(pkgName);

                const invDate = inv.formatted_invoice_date || inv.formatted_created_at?.slice(0, 10);
                if (invDate && (!user.last_booking_date || invDate > user.last_booking_date)) {
                    user.last_booking_date = invDate;
                }

                let parsedItems = [];
                try {
                    parsedItems = typeof inv.items_json === 'string' ? JSON.parse(inv.items_json) : inv.items_json;
                } catch (e) {
                    parsedItems = [];
                }

                user.booking_history.push({
                    id: `inv-${inv.id}`,
                    source: 'INVOICE',
                    source_label: 'Invoice',
                    source_badge: 'primary',
                    reference_no: inv.invoice_no,
                    invoice_id: inv.id,
                    package_name: pkgName,
                    travel_date: inv.departure_date_text || 'As scheduled',
                    pax: inv.number_of_pax || 1,
                    rooms: inv.room_required || '1 AC',
                    food_preference: inv.food_preference || 'Non Veg',
                    pickup_drop: inv.pickup_drop || 'Canning',
                    total_amount: billed,
                    paid_amount: advance,
                    due_amount: due,
                    payment_status: inv.payment_status || 'pending',
                    payment_method: inv.payment_method || 'Razorpay / Manual',
                    payment_note: inv.payment_note || '',
                    payment_proof_file: inv.payment_proof_file || null,
                    verified_by: inv.verified_by_name || null,
                    verified_at: inv.payment_verified_at || null,
                    created_at: inv.formatted_created_at || inv.formatted_invoice_date,
                    invoice_data: {
                        ...inv,
                        items: parsedItems
                    }
                });
            });

            // Process Website Reservations / Bookings
            bookings.forEach(b => {
                // If invoice already created for this booking or same transaction, avoid duplicate count
                const user = getUserRecord(b.customer_phone, b.customer_email, b.customer_name);
                
                // Check if already represented in invoices by matching invoice_number
                const alreadyHasInvoice = b.invoice_number && user.booking_history.some(h => h.reference_no === b.invoice_number);
                if (!alreadyHasInvoice) {
                    user.total_bookings += 1;
                    const cost = parseFloat(b.total_cost) || 0;
                    const isPaid = Number(b.payment_status) === 1 || String(b.payment_status).toUpperCase() === 'PAID';
                    
                    user.total_spent += cost;
                    if (isPaid) {
                        user.total_paid += cost;
                    } else {
                        user.total_due += cost;
                    }

                    const pkgName = b.package_title || 'Sundarban Package Reservation';
                    if (pkgName) user.packages.add(pkgName);

                    const bkDate = b.formatted_created_at?.slice(0, 10);
                    if (bkDate && (!user.last_booking_date || bkDate > user.last_booking_date)) {
                        user.last_booking_date = bkDate;
                    }

                    user.booking_history.push({
                        id: `res-${b.id}`,
                        source: 'RESERVATION',
                        source_label: 'Web Reservation',
                        source_badge: 'info',
                        reference_no: `DS-WEB-${b.id}`,
                        package_name: pkgName,
                        travel_date: b.formatted_departure_date || 'Upcoming',
                        pax: b.total_travelers || 1,
                        rooms: 'Standard',
                        food_preference: 'Standard Menu',
                        pickup_drop: 'Standard Point',
                        total_amount: cost,
                        paid_amount: isPaid ? cost : 0,
                        due_amount: isPaid ? 0 : cost,
                        payment_status: isPaid ? 'paid' : 'pending',
                        payment_method: b.payment_method || (b.razorpay_payment_id ? 'Razorpay' : 'Offline / Cash'),
                        payment_note: b.admin_notes || '',
                        payment_proof_file: null,
                        created_at: b.formatted_created_at
                    });
                }
            });

            // Process Converted Leads
            convertedLeads.forEach(lead => {
                const user = getUserRecord(lead.phone, lead.email, lead.lead_name);
                
                // Check if this lead already generated an invoice
                const alreadyInvoiced = invoices.some(i => i.contact_id === lead.contact_id || i.customer_phone === lead.phone);
                if (!alreadyInvoiced) {
                    user.total_bookings += 1;
                    const convertedAmount = parseFloat(lead.converted_amount) || 0;
                    user.total_spent += convertedAmount;
                    user.total_paid += convertedAmount;

                    const pkgName = lead.package_name || 'Sundarban Tour Package';
                    if (pkgName) user.packages.add(pkgName);

                    const convDate = lead.formatted_converted_at?.slice(0, 10);
                    if (convDate && (!user.last_booking_date || convDate > user.last_booking_date)) {
                        user.last_booking_date = convDate;
                    }

                    user.booking_history.push({
                        id: `lead-${lead.id}`,
                        source: 'CONVERTED_LEAD',
                        source_label: 'Converted Lead',
                        source_badge: 'success',
                        reference_no: `LEAD-${lead.contact_id || lead.id}`,
                        package_name: pkgName,
                        travel_date: lead.formatted_travel_date || 'Confirmed',
                        pax: lead.number_of_persons || 1,
                        rooms: lead.room_details || '1 AC',
                        food_preference: 'Non Veg',
                        pickup_drop: 'Canning',
                        total_amount: convertedAmount,
                        paid_amount: convertedAmount,
                        due_amount: 0,
                        payment_status: 'paid',
                        payment_method: 'Direct / Agent',
                        payment_note: lead.conversion_note || '',
                        payment_proof_file: null,
                        created_at: lead.formatted_converted_at
                    });
                }
            });

            // 5. Convert map to array and sort history inside each user
            let userList = Array.from(userMap.values()).map(u => {
                // Sort booking history by created_at desc
                u.booking_history.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                return {
                    ...u,
                    packages: Array.from(u.packages)
                };
            });

            // 6. Overall system stats
            const overallStats = {
                total_users: userList.length,
                total_bookings: userList.reduce((acc, u) => acc + u.total_bookings, 0),
                total_spent: userList.reduce((acc, u) => acc + u.total_spent, 0),
                total_paid: userList.reduce((acc, u) => acc + u.total_paid, 0),
                total_due: userList.reduce((acc, u) => acc + u.total_due, 0),
                fully_paid_users: userList.filter(u => u.total_due <= 0 && u.total_spent > 0).length,
                users_with_due: userList.filter(u => u.total_due > 0).length
            };

            // 7. Filtering
            if (payment_status && payment_status !== 'all') {
                if (payment_status === 'paid') {
                    userList = userList.filter(u => u.total_due <= 0 && u.total_spent > 0);
                } else if (payment_status === 'due') {
                    userList = userList.filter(u => u.total_due > 0);
                } else if (payment_status === 'pending') {
                    userList = userList.filter(u => u.booking_history.some(h => h.payment_status === 'pending'));
                }
            }

            if (search && search.trim() !== '') {
                const term = search.toLowerCase().trim();
                userList = userList.filter(u => 
                    u.customer_name.toLowerCase().includes(term) ||
                    u.customer_phone.includes(term) ||
                    u.customer_email.toLowerCase().includes(term) ||
                    u.customer_address.toLowerCase().includes(term) ||
                    u.packages.some(p => p.toLowerCase().includes(term))
                );
            }

            // 8. Sorting: Most recent booking date first
            userList.sort((a, b) => (b.last_booking_date || '').localeCompare(a.last_booking_date || ''));

            // 9. Pagination
            const total = userList.length;
            const totalPages = Math.ceil(total / Number(limit)) || 1;
            const startIndex = (Number(page) - 1) * Number(limit);
            const paginatedUsers = userList.slice(startIndex, startIndex + Number(limit));

            resolve({
                users: paginatedUsers,
                stats: overallStats,
                total,
                totalPages,
                page: Number(page),
                limit: Number(limit)
            });
        } catch (error) {
            console.error('[getBookingUsersListModel Error]:', error);
            reject(error);
        }
    });
}

module.exports = {
    getBookingUsersListModel
};
