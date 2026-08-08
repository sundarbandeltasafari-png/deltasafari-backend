const asyncHandler = require('express-async-handler');
const md5 = require('md5');

const { setUserById } = require('../../model/auth/authModel');
const { getUserSubscriptionModel, getParticularUser, updateUser } = require('../../model/user/userModel');

const viewProfile = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            const user = req.user;
            const loginUser = await getParticularUser({ id: user.id });
            const userObj = Array.isArray(loginUser) && loginUser.length > 0 ? { ...loginUser[0] } : { ...user };
            delete userObj.password;
            return res.status(200).json({ status: true, msg: 'User Details.', userDetails: userObj });
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.error('viewProfile Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const editProfile = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            const userId = req.user.id;
            const body = req.body || {};
            const editDetails = {};

            if (body.first_name !== undefined && body.first_name !== '') editDetails.first_name = body.first_name;
            if (body.last_name !== undefined && body.last_name !== '') editDetails.last_name = body.last_name;
            if (body.phone !== undefined) editDetails.phone = body.phone;
            if (body.gender !== undefined) editDetails.gender = body.gender;
            if (body.address !== undefined) editDetails.address = body.address;
            if (body.city !== undefined) editDetails.city = body.city;

            if (req.file) {
                editDetails.profile_pic = req.file.path.replace(/\\/g, '/');
            }

            if (Object.keys(editDetails).length === 0) {
                return res.status(400).json({ status: false, msg: 'No fields provided to update.' });
            }

            await updateUser(editDetails, { id: userId });

            const updatedUserList = await getParticularUser({ id: userId });
            const userObj = Array.isArray(updatedUserList) && updatedUserList.length > 0 ? { ...updatedUserList[0] } : { ...req.user, ...editDetails };
            delete userObj.password;

            return res.status(200).json({ 
                status: true, 
                msg: 'User Profile updated successfully!',
                userDetails: userObj
            });
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.error('editProfile Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const getUserSubscription = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            var user = [req?.user];
            const mysubscription = await getUserSubscriptionModel(user[0]?.id);
            // console.log(mysubscription)
            // const currentPackage = await 
            return res.status(200).json({ status: true, msg: 'User Subscriptions.', subscription: mysubscription.length > 0 && mysubscription[0].expire_on > Date.now() ? mysubscription[0] : null })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getUserSubscriptionHistory = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            var user = [req?.user];
            const mysubscriptionHistory = await getUserSubscriptionModel(user[0]?.id);
            return res.status(200).json({ status: true, msg: 'User Subscriptions.', subscriptionHistory: mysubscriptionHistory })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const changePassword = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            const userId = req.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body || {};

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({ status: false, msg: 'Please fill in all password fields.' });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ status: false, msg: 'New password and confirm password do not match.' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ status: false, msg: 'New password must be at least 6 characters long.' });
            }

            const userList = await getParticularUser({ id: userId });
            const dbUser = Array.isArray(userList) && userList.length > 0 ? userList[0] : req.user;

            if (dbUser.password && dbUser.password !== md5(currentPassword)) {
                return res.status(400).json({ status: false, msg: 'Current password is incorrect.' });
            }

            await updateUser({ password: md5(newPassword) }, { id: userId });

            return res.status(200).json({ status: true, msg: 'Password changed successfully!' });
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.error('changePassword Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});


// ==========================================
// AGENT DASHBOARD & B2B MANAGEMENT CONTROLLER
// ==========================================
const connection = require('../../Connection');

const getAgentDashboardStats = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access.' });
        }
        const agentId = req.user.id;

        // 1. Fetch Agent Profile and Bank Info
        const agentRows = await new Promise((resolve, reject) => {
            connection.query('SELECT id, first_name, last_name, email, phone, user_type, wallet_balance, bank_name, account_number, ifsc_code, account_holder, upi_id, profile_pic FROM user_master WHERE id = ?', [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });
        const agent = agentRows.length > 0 ? agentRows[0] : req.user;

        // 2. Fetch Agent Bookings
        const bookings = await new Promise((resolve, reject) => {
            const sql = `SELECT bookings.*, bookings.id as bookings_id, 
                packages_master.title as package_title, packages_master.slug, packages_master.duration_days, packages_master.duration_nights,
                packages_master.base_price as pkg_base_price, packages_master.agent_discount as pkg_agent_discount, packages_master.agent_actual_price as pkg_agent_price
            FROM bookings 
            LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
            WHERE bookings.user_id = ? 
            ORDER BY bookings.id DESC`;
            connection.query(sql, [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        // 3. Fetch Wallet Transactions
        const transactions = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 15', [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        // 4. Fetch Withdrawal Requests
        const withdrawals = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY id DESC LIMIT 10', [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        // 5. Aggregate Analytics
        let totalCommissionEarned = 0;
        let pendingCommission = 0;
        let totalBookingVolume = 0;
        let confirmedBookings = 0;
        let pendingBookings = 0;

        bookings.forEach((b) => {
            const comm = Number(b.commission_amount) || 0;
            const cost = Number(b.total_cost) || 0;
            totalBookingVolume += cost;

            if (Number(b.booking_status) === 2 || Number(b.commission_status) === 1) {
                totalCommissionEarned += comm;
                confirmedBookings++;
            } else if (Number(b.booking_status) === 1) {
                pendingCommission += comm;
                pendingBookings++;
            }
        });

        // Monthly trajectory graph (last 6 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const monthlyStats = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            const mBookings = bookings.filter((b) => {
                const bDate = new Date(b.created_at || b.departure_date);
                return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
            });

            const mCommission = mBookings.reduce((sum, b) => sum + (Number(b.commission_amount) || 0), 0);
            const mVolume = mBookings.reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);

            monthlyStats.push({
                month: mKey,
                shortMonth: monthNames[d.getMonth()],
                bookingsCount: mBookings.length,
                commission: mCommission,
                volume: mVolume
            });
        }

        return res.status(200).json({
            status: true,
            msg: 'Agent Dashboard Data fetched successfully.',
            stats: {
                walletBalance: Number(agent.wallet_balance) || 0,
                totalCommissionEarned,
                pendingCommission,
                totalBookingVolume,
                totalBookings: bookings.length,
                confirmedBookings,
                pendingBookings,
                monthlyStats
            },
            agent: {
                id: agent.id,
                first_name: agent.first_name,
                last_name: agent.last_name,
                email: agent.email,
                phone: agent.phone,
                wallet_balance: Number(agent.wallet_balance) || 0,
                bank_name: agent.bank_name || '',
                account_number: agent.account_number || '',
                ifsc_code: agent.ifsc_code || '',
                account_holder: agent.account_holder || '',
                upi_id: agent.upi_id || '',
                profile_pic: agent.profile_pic || ''
            },
            bookings,
            transactions,
            withdrawals
        });
    } catch (error) {
        console.error('getAgentDashboardStats Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to load Agent dashboard data.' });
    }
});

const updateAgentBankDetails = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access.' });
        }
        const agentId = req.user.id;
        const { bank_name, account_number, ifsc_code, account_holder, upi_id } = req.body || {};

        if (!account_holder && !account_number && !ifsc_code && !upi_id) {
            return res.status(400).json({ status: false, msg: 'Please enter bank account or UPI details.' });
        }

        const updateData = {};
        if (bank_name !== undefined) updateData.bank_name = bank_name;
        if (account_number !== undefined) updateData.account_number = account_number;
        if (ifsc_code !== undefined) updateData.ifsc_code = ifsc_code.toUpperCase().trim();
        if (account_holder !== undefined) updateData.account_holder = account_holder;
        if (upi_id !== undefined) updateData.upi_id = upi_id.trim();

        await new Promise((resolve, reject) => {
            connection.query('UPDATE user_master SET ? WHERE id = ?', [updateData, agentId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        return res.status(200).json({
            status: true,
            msg: 'Indian Bank Account & UPI details updated successfully!',
            bankDetails: updateData
        });
    } catch (error) {
        console.error('updateAgentBankDetails Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong while saving bank details.' });
    }
});

const requestAgentWithdrawal = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access.' });
        }
        const agentId = req.user.id;
        const { amount, bank_name, account_number, ifsc_code, account_holder, upi_id } = req.body || {};
        const withdrawAmount = Number(amount);

        if (!withdrawAmount || withdrawAmount <= 0) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid withdrawal amount in ₹.' });
        }

        if (withdrawAmount < 500) {
            return res.status(400).json({ status: false, msg: 'Minimum withdrawal amount is ₹500.' });
        }

        // Fetch current wallet balance
        const agentRows = await new Promise((resolve, reject) => {
            connection.query('SELECT wallet_balance, bank_name, account_number, ifsc_code, account_holder, upi_id FROM user_master WHERE id = ?', [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        if (agentRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'Agent account not found.' });
        }

        const agent = agentRows[0];
        const currentBalance = Number(agent.wallet_balance) || 0;

        if (withdrawAmount > currentBalance) {
            return res.status(400).json({
                status: false,
                msg: `Insufficient wallet balance. Your available balance is ₹${currentBalance.toLocaleString('en-IN')}.`
            });
        }

        const finalBank = bank_name || agent.bank_name || '';
        const finalAcc = account_number || agent.account_number || '';
        const finalIfsc = ifsc_code || agent.ifsc_code || '';
        const finalHolder = account_holder || agent.account_holder || '';
        const finalUpi = upi_id || agent.upi_id || '';

        if (!finalAcc && !finalUpi) {
            return res.status(400).json({ status: false, msg: 'Please provide Bank Account Number or UPI ID for payout.' });
        }

        // 1. Deduct balance from user_master
        await new Promise((resolve, reject) => {
            connection.query('UPDATE user_master SET wallet_balance = wallet_balance - ? WHERE id = ?', [withdrawAmount, agentId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // 2. Insert into withdrawal_requests
        const withdrawPayload = {
            user_id: agentId,
            amount: withdrawAmount,
            account_holder: finalHolder,
            bank_name: finalBank,
            account_number: finalAcc,
            ifsc_code: finalIfsc,
            upi_id: finalUpi,
            status: 'PENDING',
            admin_remarks: 'Withdrawal request submitted by agent.'
        };

        const withdrawRes = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO withdrawal_requests SET ?', withdrawPayload, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // 3. Insert into wallet_transactions
        const transPayload = {
            user_id: agentId,
            booking_id: null,
            amount: withdrawAmount,
            type: 'DEBIT',
            source: 'WITHDRAWAL',
            description: `Payout withdrawal request #${withdrawRes.insertId} to ${finalUpi ? `UPI: ${finalUpi}` : `A/C: ${finalAcc}`}`,
            status: 'PENDING'
        };

        await new Promise((resolve, reject) => {
            connection.query('INSERT INTO wallet_transactions SET ?', transPayload, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        return res.status(200).json({
            status: true,
            msg: `Withdrawal request of ₹${withdrawAmount.toLocaleString('en-IN')} submitted successfully! Payout will be processed to your bank/UPI.`,
            newBalance: currentBalance - withdrawAmount
        });
    } catch (error) {
        console.error('requestAgentWithdrawal Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong while processing withdrawal.' });
    }
});

const createAgentBooking = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access. Please login as Agent.' });
        }
        const agentId = req.user.id;
        const { package_id, departure_date, customer_name, customer_phone, customer_email, travelers, customer_comment } = req.body || {};

        if (!package_id) {
            return res.status(400).json({ status: false, msg: 'Please select a valid tour package.' });
        }
        if (!customer_name || !customer_phone) {
            return res.status(400).json({ status: false, msg: 'Please provide primary customer name and contact phone number.' });
        }

        const travelersList = Array.isArray(travelers) && travelers.length > 0 
            ? travelers 
            : [{ name: customer_name, age: 30, gender: 'Male' }];
        const totalTravelers = travelersList.length;

        // Fetch package to calculate pricing & agent commission
        const pkgRows = await new Promise((resolve, reject) => {
            connection.query('SELECT id, title, base_price, discount, discount_type, actual_price, agent_discount, agent_actual_price FROM packages_master WHERE id = ?', [package_id], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        if (pkgRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'Selected package not found.' });
        }

        const pkg = pkgRows[0];
        const basePrice = Number(pkg.base_price) || 0;
        const agentNetPerPerson = Number(pkg.agent_actual_price) || Number(pkg.actual_price) || basePrice;
        const totalCost = agentNetPerPerson * totalTravelers;
        const commPerPerson = Math.max(0, basePrice - agentNetPerPerson);
        const totalCommission = commPerPerson * totalTravelers;

        const bookingPayload = {
            package_id: pkg.id,
            user_id: agentId,
            user_type: 3, // Agent
            customer_name: customer_name.trim(),
            customer_phone: customer_phone.trim(),
            customer_email: customer_email ? customer_email.trim() : '',
            total_travelers: totalTravelers,
            travelers: JSON.stringify(travelersList),
            base_price: basePrice,
            actual_price: agentNetPerPerson,
            total_cost: totalCost,
            commission_amount: totalCommission,
            commission_status: 0, // Pending
            booking_status: 1, // 1 = Requested / Pending Admin Confirmation
            payment_status: 0, // 0 = Unsettled
            currency: 'INR',
            departure_date: departure_date || null,
            customer_comment: customer_comment ? customer_comment.trim() : '',
            request_type: 'B2B_AGENT_BOOKING'
        };

        const result = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO bookings SET ?', bookingPayload, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });

        return res.status(200).json({
            status: true,
            msg: 'B2B Client Booking request created successfully! It has been submitted to Admin for verification and booking confirmation.',
            bookingId: result.insertId,
            totalCommission,
            totalCost
        });
    } catch (error) {
        console.error('createAgentBooking Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to create agent booking request.' });
    }
});

const getAgentBookings = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access.' });
        }
        const agentId = req.user.id;

        const bookings = await new Promise((resolve, reject) => {
            const sql = `SELECT bookings.*, bookings.id as bookings_id, 
                packages_master.title as package_title, packages_master.slug, packages_master.duration_days, packages_master.duration_nights,
                packages_master.base_price as pkg_base_price, packages_master.agent_discount as pkg_agent_discount, packages_master.agent_actual_price as pkg_agent_price
            FROM bookings 
            LEFT JOIN packages_master ON packages_master.id = bookings.package_id 
            WHERE bookings.user_id = ? 
            ORDER BY bookings.id DESC`;
            connection.query(sql, [agentId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        return res.status(200).json({
            status: true,
            msg: 'Agent bookings fetched successfully.',
            bookings
        });
    } catch (error) {
        console.error('getAgentBookings Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to fetch agent bookings.' });
    }
});

// ==========================================
// REFERRAL & EARN COMMISSION SYSTEM
// ==========================================

async function processReferralCommission(bookingId, customerUserId, packageId) {
    try {
        if (!customerUserId || !packageId || !bookingId) return;

        // 1. Check if customer was referred by someone
        const userRows = await new Promise((resolve) => {
            connection.query('SELECT id, referred_by_id FROM user_master WHERE id = ?', [customerUserId], (err, rows) => {
                resolve(rows || []);
            });
        });

        if (userRows.length === 0 || !userRows[0].referred_by_id) {
            return; // Not a referred user
        }

        const referrerId = userRows[0].referred_by_id;

        // Prevent duplicate commission for the same booking
        const existingTx = await new Promise((resolve) => {
            connection.query('SELECT id FROM referral_transactions WHERE booking_id = ? AND referrer_id = ? LIMIT 1', [bookingId, referrerId], (err, rows) => {
                resolve(rows || []);
            });
        });
        if (existingTx.length > 0) return;

        // 2. Fetch package user_commission (fallback ₹500.00)
        const pkgRows = await new Promise((resolve) => {
            connection.query('SELECT id, title, user_commission FROM packages_master WHERE id = ?', [packageId], (err, rows) => {
                resolve(rows || []);
            });
        });

        const userComm = pkgRows.length > 0 && Number(pkgRows[0].user_commission) > 0
            ? Number(pkgRows[0].user_commission)
            : 500.00;

        const pkgTitle = pkgRows.length > 0 ? pkgRows[0].title : 'Tour Package';

        // 3. Insert referral_transaction
        const refPayload = {
            referrer_id: referrerId,
            referred_user_id: customerUserId,
            booking_id: bookingId,
            package_id: packageId,
            commission_amount: userComm,
            status: 'CREDITED'
        };

        await new Promise((resolve) => {
            connection.query('INSERT INTO referral_transactions SET ?', refPayload, (err, res) => {
                resolve(res);
            });
        });

        // 4. Update referrer's wallet balance in user_master
        await new Promise((resolve) => {
            connection.query('UPDATE user_master SET wallet_balance = wallet_balance + ? WHERE id = ?', [userComm, referrerId], (err, res) => {
                resolve(res);
            });
        });

        // 5. Insert wallet_transaction for referrer
        const walletPayload = {
            user_id: referrerId,
            booking_id: bookingId,
            amount: userComm,
            type: 'CREDIT',
            source: 'REFERRAL_COMMISSION',
            description: `Referral cash reward earned for friend booking "${pkgTitle}" (#${bookingId})`,
            status: 'CREDITED'
        };

        await new Promise((resolve) => {
            connection.query('INSERT INTO wallet_transactions SET ?', walletPayload, (err, res) => {
                resolve(res);
            });
        });

        console.log(`[Referral Program] Credited ₹${userComm} to referrer #${referrerId} for booking #${bookingId}`);
    } catch (err) {
        console.error('Error processing referral commission:', err.message);
    }
}

const getReferralStats = asyncHandler(async (req, res) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'Unauthorized access.' });
        }
        const userId = req.user.id;

        // Ensure user has a referral code
        let dbUserRows = await new Promise((resolve) => {
            connection.query('SELECT id, first_name, last_name, email, phone, referral_code, wallet_balance FROM user_master WHERE id = ?', [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        let dbUser = dbUserRows.length > 0 ? dbUserRows[0] : req.user;
        if (!dbUser.referral_code) {
            const newCode = 'DS-' + (dbUser.first_name ? dbUser.first_name.substring(0, 4).toUpperCase() : 'DS') + Math.floor(1000 + Math.random() * 9000);
            await new Promise((resolve) => {
                connection.query('UPDATE user_master SET referral_code = ? WHERE id = ?', [newCode, userId], () => resolve());
            });
            dbUser.referral_code = newCode;
        }

        // Fetch referred users list
        const referredUsers = await new Promise((resolve) => {
            const sql = `
                SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
                    COUNT(DISTINCT b.id) AS total_bookings,
                    COALESCE(SUM(rt.commission_amount), 0) AS commission_earned
                FROM user_master u
                LEFT JOIN bookings b ON b.user_id = u.id
                LEFT JOIN referral_transactions rt ON rt.referred_user_id = u.id AND rt.referrer_id = ?
                WHERE u.referred_by_id = ?
                GROUP BY u.id
                ORDER BY u.id DESC
            `;
            connection.query(sql, [userId, userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // Fetch referral transactions
        const referralTransactions = await new Promise((resolve) => {
            const sql = `
                SELECT rt.*, 
                    p.title AS package_title, p.slug AS package_slug,
                    u.first_name AS friend_first_name, u.last_name AS friend_last_name, u.email AS friend_email
                FROM referral_transactions rt
                LEFT JOIN packages_master p ON p.id = rt.package_id
                LEFT JOIN user_master u ON u.id = rt.referred_user_id
                WHERE rt.referrer_id = ?
                ORDER BY rt.id DESC
            `;
            connection.query(sql, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        const totalReferredCount = referredUsers.length;
        const totalCommissionEarned = referralTransactions.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0);
        const totalSuccessfulBookings = referralTransactions.length;

        const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || 'http://localhost:3000/';
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

        return res.status(200).json({
            status: true,
            msg: 'Referral statistics loaded successfully.',
            referralCode: dbUser.referral_code,
            referralUrl: `${cleanBaseUrl}login?ref=${dbUser.referral_code}`,
            walletBalance: Number(dbUser.wallet_balance) || 0,
            stats: {
                totalReferredCount,
                totalSuccessfulBookings,
                totalCommissionEarned
            },
            referredUsers,
            referralTransactions
        });
    } catch (error) {
        console.error('getReferralStats Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to load referral statistics.' });
    }
});

const getCustomPackageEnquiries = asyncHandler(async (req, res) => {
    try {
        const userId = req.user ? req.user.id : (req.body?.user_id || req.query?.user_id);
        const userEmail = req.user ? req.user.email : (req.body?.email || req.query?.email);
        const userPhone = req.user ? req.user.phone : (req.body?.phone || req.query?.phone);

        if (!userId && !userEmail && !userPhone) {
            return res.status(400).json({ status: false, msg: 'User session required.' });
        }

        const db = require('../../Connection');

        const sqlHoliday = `
            SELECT id, 'HOLIDAY' AS enquiry_type, full_name, email, phone, destination, departure_city, travel_date, 
                   duration_days, duration_nights, adults_count, children_count, infants_count, hotel_category, 
                   meal_plan, cab_type, include_flights, budget, message, status, created_at
            FROM holiday_enquiries
            WHERE user_id = ? OR (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?)
            ORDER BY id DESC
        `;

        const sqlCorporate = `
            SELECT id, 'CORPORATE' AS enquiry_type, company_name, full_name, email, phone, city AS departure_city, 
                   trip_type, destination, departure_date AS travel_date, travel_window, duration_days, duration_nights, 
                   adults_count, male_count, female_count, total_employees, children_count, infants_count, 
                   hotel_category, room_sharing, meal_plan, cab_type, include_flights, budget_band AS budget, 
                   special_notes AS message, status, created_at
            FROM corporate_lead_enquiries
            WHERE user_id = ? OR (email IS NOT NULL AND email = ?) OR (phone IS NOT NULL AND phone = ?)
            ORDER BY id DESC
        `;

        db.query(sqlHoliday, [userId, userEmail, userPhone], (hErr, holidays) => {
            if (hErr) console.error("Error querying holiday_enquiries:", hErr);
            const holidayList = (!hErr && holidays) ? holidays : [];

            db.query(sqlCorporate, [userId, userEmail, userPhone], (cErr, corporates) => {
                if (cErr) console.error("Error querying corporate_lead_enquiries:", cErr);
                const corporateList = (!cErr && corporates) ? corporates : [];

                const allEnquiries = [...holidayList, ...corporateList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                return res.status(200).json({
                    status: true,
                    msg: 'Custom package enquiries loaded successfully.',
                    enquiries: allEnquiries
                });
            });
        });
    } catch (error) {
        console.error('getCustomPackageEnquiries Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to fetch custom package enquiries.' });
    }
});

module.exports = { 
    getUserSubscription, 
    getUserSubscriptionHistory, 
    viewProfile, 
    editProfile, 
    changePassword,
    getAgentDashboardStats,
    updateAgentBankDetails,
    requestAgentWithdrawal,
    createAgentBooking,
    getAgentBookings,
    processReferralCommission,
    getReferralStats,
    getCustomPackageEnquiries
};