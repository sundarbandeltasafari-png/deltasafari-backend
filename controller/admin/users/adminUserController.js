const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const {
    getAllUsersModel,
    setUserModel,
    deleteUserModel,
    insertUserModel,
    insertUserAddressModel,
    insertUserSocialModel,
    getAllUserModel,
    getUserStatusModel,
    getParticularUserModel,
    getSearchUsersModel,
    getParticularAdminUserModel,
    getAdminUsersPaginatedModel
} = require('../../../model/admin/user/adminUserModel');

const connection = require('../../../Connection');
const { urlDecode } = require('../../../helper/urlHelper');


const userStatus = asyncHandler(async (req, res, next) => {
    try {
        const { user } = req.query;
        if (!user) {
            const error = new Error('No user found to get your status.');
            res.status(400);
            next(error);
        }
        const total = await getUserStatusModel({ admin: user });
        const active = await getUserStatusModel({ status: 1, admin: user });
        const inactive = await getUserStatusModel({ status: 0, admin: user });
        const deleted = await getUserStatusModel({ status: 4, admin: user });
        return res.status(200).json({ status: true, msg: 'All user status..', userStatus: [{ ...total[0], title: "Total" }, { ...active[0], title: "Active" }, { ...inactive[0], title: "Inactive" }, { ...deleted[0], title: "Deleted" }] })
    } catch (error) {
        next(error);
    }
})


// Admin User 
const insertAdminUser = asyncHandler(async (req, res, next) => {
    try {
        const accountDetails = req?.body?.account_details || {};
        const personalInfo = req?.body?.personal_info || {};
        const socialLinksData = req?.body?.social_links || {};

        const phone = (accountDetails?.phone || '').toString().trim();
        const email = (accountDetails?.email || '').toString().trim();
        const password = accountDetails?.password || '';
        const confirmPassword = accountDetails?.confirm_password || '';

        if (!phone && !email) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid Phone number or Email address.' });
        }
        if (!password) {
            return res.status(400).json({ status: false, msg: 'Please enter a password.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ status: false, msg: 'Password and Confirm Password do not match.' });
        }

        // Check if email already exists in user_master
        if (email) {
            const existingEmailUser = await new Promise((resolve) => {
                connection.query(`SELECT id, email, first_name, last_name, admin FROM user_master WHERE email = ?`, [email], (err, rows) => {
                    resolve(rows || []);
                });
            });
            if (existingEmailUser && existingEmailUser.length > 0) {
                return res.status(400).json({ 
                    status: false, 
                    msg: `An account with the email address "${email}" already exists. Please use a different email or update the existing account.` 
                });
            }
        }

        // Check if phone already exists in user_master
        if (phone) {
            const existingPhoneUser = await new Promise((resolve) => {
                connection.query(`SELECT id, phone, first_name, last_name, admin FROM user_master WHERE phone = ?`, [phone], (err, rows) => {
                    resolve(rows || []);
                });
            });
            if (existingPhoneUser && existingPhoneUser.length > 0) {
                return res.status(400).json({ 
                    status: false, 
                    msg: `An account with the phone number "${phone}" already exists. Please use a different phone number.` 
                });
            }
        }

        const permisionGroupId = accountDetails?.permision_group_id || req?.body?.permision_group_id || null;

        const user = {
            phone: phone || null,
            email: email || null,
            password: md5(password),
            first_name: personalInfo?.first_name || '',
            last_name: personalInfo?.last_name || '',
            bio: personalInfo?.bio || '',
            profile_picture: personalInfo?.profile_picture_url || '',
            permision_group_id: permisionGroupId,
            role_id: permisionGroupId,
            admin: 2,
            status: 1
        };

        const reporter = await insertUserModel(user);
        const insertId = reporter?.insertId;

        if (insertId && socialLinksData) {
            await Promise.all(
                Object.entries(socialLinksData).map(async ([key, value]) => {
                    if (value && value.trim()) {
                        await insertUserSocialModel({ user_id: insertId, url: value.trim(), platform: key });
                    }
                })
            );
        }

        if (insertId) {
            const addressdata = {
                street: personalInfo?.street || '',
                city: personalInfo?.city || '',
                state: personalInfo?.state || '',
                zip_code: personalInfo?.zip_code || '',
                country: personalInfo?.country || ''
            };
            await insertUserAddressModel({ user_id: insertId, ...addressdata });
        }

        return res.status(200).json({ status: true, msg: 'Admin user created successfully.', users: reporter, insertId: insertId });
    } catch (error) {
        next(error);
    }
});

const getAllAdminUser = asyncHandler(async (req, res, next) => {
    try {
        const page = parseInt(req?.query?.page || req?.body?.page || 1);
        const limit = parseInt(req?.query?.limit || req?.body?.limit || 25);
        const search = req?.query?.search || req?.body?.searchData || req?.body?.search || '';
        const status = req?.query?.status !== undefined ? req?.query?.status : req?.body?.status;
        const role = req?.query?.role !== undefined ? req?.query?.role : req?.body?.role;

        const result = await getAdminUsersPaginatedModel({ page, limit, search, status, role });
        return res.status(200).json({
            status: true,
            msg: 'All admin users..',
            adminUsers: result.adminUsers,
            reporters: result.adminUsers,
            total: result.total,
            page: result.page,
            limit: result.limit,
            hasMore: result.hasMore
        });
    } catch (error) {
        next(error);
    }
});

const getParticularAdminUser = asyncHandler(async (req, res, next) => {
    try {
        let rawId = req?.query?.id || req?.params?.id || req?.body?.id;
        if (!rawId) {
            return res.status(400).json({ status: false, msg: 'Please provide admin user id.' });
        }

        let targetId = rawId;
        if (typeof rawId === 'string' && isNaN(Number(rawId))) {
            try {
                const decoded = urlDecode(rawId);
                if (decoded && !isNaN(Number(decoded))) {
                    targetId = Number(decoded);
                }
            } catch (e) {
                targetId = rawId;
            }
        } else {
            targetId = Number(rawId);
        }

        const user = await getParticularAdminUserModel(targetId);
        if (!user) {
            return res.status(404).json({ status: false, msg: 'Admin user not found.' });
        }
        return res.status(200).json({ status: true, msg: 'Admin user details', user: { ...user, password: '' } });
    } catch (error) {
        next(error);
    }
});

const updateAdminUser = asyncHandler(async (req, res, next) => {
    try {
        let rawId = req?.body?.id || req?.query?.id;
        if (!rawId) {
            return res.status(400).json({ status: false, msg: 'Admin user ID is required.' });
        }

        let id = rawId;
        if (typeof rawId === 'string' && isNaN(Number(rawId))) {
            try {
                const decoded = urlDecode(rawId);
                if (decoded && !isNaN(Number(decoded))) {
                    id = Number(decoded);
                }
            } catch (e) {
                id = rawId;
            }
        } else {
            id = Number(rawId);
        }

        const accountDetails = req?.body?.account_details || {};
        const personalInfo = req?.body?.personal_info || {};
        const socialLinksData = req?.body?.social_links || {};

        // Check for email collision with other users
        if (accountDetails.email && accountDetails.email.toString().trim()) {
            const emailToCheck = accountDetails.email.toString().trim();
            const collision = await new Promise((resolve) => {
                connection.query(`SELECT id FROM user_master WHERE email = ? AND id != ?`, [emailToCheck, id], (err, rows) => {
                    resolve(rows || []);
                });
            });
            if (collision && collision.length > 0) {
                return res.status(400).json({ status: false, msg: `The email "${emailToCheck}" is already in use by another account.` });
            }
        }

        // Check for phone collision with other users
        if (accountDetails.phone && accountDetails.phone.toString().trim()) {
            const phoneToCheck = accountDetails.phone.toString().trim();
            const collision = await new Promise((resolve) => {
                connection.query(`SELECT id FROM user_master WHERE phone = ? AND id != ?`, [phoneToCheck, id], (err, rows) => {
                    resolve(rows || []);
                });
            });
            if (collision && collision.length > 0) {
                return res.status(400).json({ status: false, msg: `The phone number "${phoneToCheck}" is already in use by another account.` });
            }
        }

        const updateData = {};
        if (personalInfo.first_name !== undefined) updateData.first_name = personalInfo.first_name.trim();
        if (personalInfo.last_name !== undefined) updateData.last_name = personalInfo.last_name.trim();
        if (accountDetails.phone !== undefined) updateData.phone = accountDetails.phone.trim();
        if (accountDetails.email !== undefined) updateData.email = accountDetails.email.trim();
        if (personalInfo.bio !== undefined) updateData.bio = personalInfo.bio;
        if (personalInfo.profile_picture_url !== undefined && personalInfo.profile_picture_url) {
            updateData.profile_picture = personalInfo.profile_picture_url;
        }
        if (req?.body?.status !== undefined) {
            updateData.status = parseInt(req.body.status);
        }
        const permisionGroupId = accountDetails.permision_group_id || req?.body?.permision_group_id;
        if (permisionGroupId !== undefined) {
            updateData.permision_group_id = permisionGroupId ? parseInt(permisionGroupId) : null;
            updateData.role_id = permisionGroupId ? parseInt(permisionGroupId) : null;
        }

        // Only update password if a new one is provided and valid
        if (accountDetails.password && accountDetails.password.trim().length >= 6) {
            updateData.password = md5(accountDetails.password.trim());
        }

        if (Object.keys(updateData).length > 0) {
            await setUserModel(updateData, id);
        }

        // Update Address if provided
        if (personalInfo.street !== undefined || personalInfo.city !== undefined || personalInfo.state !== undefined) {
            const addressData = {
                street: personalInfo.street || '',
                city: personalInfo.city || '',
                state: personalInfo.state || '',
                zip_code: personalInfo.zip_code || '',
                country: personalInfo.country || ''
            };
            connection.query(`DELETE FROM addresses WHERE user_id = ?`, [id], async () => {
                await insertUserAddressModel({ user_id: id, ...addressData });
            });
        }

        // Update Socials if provided
        if (socialLinksData && Object.keys(socialLinksData).length > 0) {
            connection.query(`DELETE FROM socials WHERE user_id = ?`, [id], async () => {
                await Promise.all(
                    Object.entries(socialLinksData).map(async ([key, val]) => {
                        if (val && val.trim()) {
                            await insertUserSocialModel({ user_id: id, url: val.trim(), platform: key });
                        }
                    })
                );
            });
        }

        return res.status(200).json({ status: true, msg: 'Admin user updated successfully.' });
    } catch (error) {
        next(error);
    }
});


// Customer User
const insertUser = asyncHandler(async (req, res, next) => {
    try {
        if (req?.body?.account_details && req?.body?.account_details?.password && req?.body?.account_details?.phone && (req?.body?.account_details?.password != req?.body?.account_details?.confirm_password)) {
            const error = new Error('Please enter a valid User details.');
            res.status(400);
            next(error);
        }
        const user = {
            phone: req?.body?.account_details?.phone,
            password: md5(req?.body?.account_details?.password),
            first_name: req?.body?.personal_info?.first_name,
            last_name: req?.body?.personal_info?.last_name,
            bio: req?.body?.personal_info?.bio,
            profile_picture: req?.body?.personal_info?.profile_picture_url,
            admin: 2
        }
        const reporter = await insertUserModel(user);
        if (req?.body?.social_links) {
            const socialLinks = await Promise.all(
                Object.entries(req?.body?.social_links).map(async ([key, value]) => {
                    const social = await insertUserSocialModel({ user_id: reporter?.insertId, url: value, platform: key });
                }))
        }
        const addressdata = {
            street: req?.body?.personal_info?.street,
            city: req?.body?.personal_info?.city,
            state: req?.body?.personal_info?.state,
            zip_code: req?.body?.personal_info?.zip_code,
            country: req?.body?.personal_info?.country
        }
        const address = await insertUserAddressModel({ user_id: reporter?.insertId, ...addressdata });
        return res.status(200).json({ status: true, msg: 'User update successfully.', users: reporter })
    } catch (error) {
        next(error)
    }
})

const getAllCustomerUser = asyncHandler(async (req, res, next) => {
    try {
        const users = await getAllUserModel({ admin: 0 });
        return res.status(200).json({ status: true, msg: 'All users..', users: users })
    } catch (error) {
        next(error)
    }
})

const getAllUser = asyncHandler(async (req, res, next) => {
    try {
        const users = await getAllUsersModel({ admin: 0 });
        return res.status(200).json({ status: true, msg: 'All Users..', users: users })
    } catch (error) {
        next(error)
    }
})

const setUser = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.body.user && !req?.body?.id) {
            const error = new Error('Please enter a valid user.');
            res.status(400);
            next(error);
        }
        const users = await setUserModel(req?.body?.user, req?.body?.id);
        return res.status(200).json({ status: true, msg: 'User update successfully.', users: users })
    } catch (error) {
        next(error)
    }
})

const deleteUser = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.body?.id) {
            const error = new Error('Please enter a valid user.');
            res.status(400);
            next(error);
        }
        const users = await deleteUserModel(req?.body?.id);
        return res.status(200).json({ status: true, msg: 'User update successfully.', users: users })
    } catch (error) {
        next(error)
    }
})

const getParticularUser = asyncHandler(async (req, res, next) => {
    try {
        const rawId = req?.query?.id;
        if (!rawId) {
            return res.status(400).json({ status: false, msg: 'Please provide a valid user ID.' });
        }

        let userId = rawId;
        if (typeof rawId === 'string' && isNaN(Number(rawId))) {
            try {
                const decoded = urlDecode(rawId);
                if (decoded && !isNaN(Number(decoded))) {
                    userId = Number(decoded);
                }
            } catch (e) {
                userId = rawId;
            }
        } else {
            userId = Number(rawId);
        }

        // 1. Fetch User Record
        const userRows = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM user_master WHERE id = ?', [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        if (!userRows || userRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'User not found.' });
        }

        const user = JSON.parse(JSON.stringify(userRows[0]));
        delete user.password; // Remove password hash for security

        const userEmail = user.email ? user.email.trim() : '';
        const userPhone = user.phone ? user.phone.trim() : '';

        // 2. Fetch Addresses
        const addresses = await new Promise((resolve) => {
            connection.query('SELECT * FROM addresses WHERE user_id = ?', [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 3. Fetch Socials
        const socials = await new Promise((resolve) => {
            connection.query('SELECT * FROM socials WHERE user_id = ?', [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 4. Fetch Saved Packages / Wishlist (with package assets and details)
        const savedPackages = await new Promise((resolve) => {
            connection.query(`
                SELECT sp.id as saved_id, sp.created_at as saved_at,
                       p.id as package_id, p.name as package_name, p.slug, p.price, p.offer_price,
                       p.duration, p.duration_night, p.description,
                       pa.path as package_image, pt.name as package_type_name,
                       z.name as destination_name
                FROM saved_packages sp
                LEFT JOIN packages_master p ON sp.package_id = p.id
                LEFT JOIN package_assets pa ON p.id = pa.package_id
                LEFT JOIN package_types pt ON p.package_type = pt.id
                LEFT JOIN zone z ON p.to_destination = z.id
                WHERE sp.user_id = ?
                GROUP BY sp.id
                ORDER BY sp.id DESC
            `, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 5. Fetch Bookings (matching user_id OR phone OR email)
        const bookings = await new Promise((resolve) => {
            connection.query(`
                SELECT b.*, p.name as package_name, p.slug as package_slug, pa.path as package_image,
                       pt.name as package_type_name
                FROM bookings b
                LEFT JOIN packages_master p ON b.package_id = p.id
                LEFT JOIN package_assets pa ON p.id = pa.package_id
                LEFT JOIN package_types pt ON p.package_type = pt.id
                WHERE b.user_id = ? OR (b.customer_phone = ? AND ? != '') OR (b.customer_email = ? AND ? != '')
                GROUP BY b.id
                ORDER BY b.id DESC
            `, [userId, userPhone, userPhone, userEmail, userEmail], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 6. Fetch Holiday / Custom Package Enquiries (matching user_id OR phone OR email)
        const holidayEnquiries = await new Promise((resolve) => {
            connection.query(`
                SELECT * FROM holiday_enquiries
                WHERE user_id = ? OR (phone = ? AND ? != '') OR (email = ? AND ? != '')
                ORDER BY id DESC
            `, [userId, userPhone, userPhone, userEmail, userEmail], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 7. Fetch Corporate Lead Enquiries (matching user_id OR phone OR email)
        const corporateEnquiries = await new Promise((resolve) => {
            connection.query(`
                SELECT * FROM corporate_lead_enquiries
                WHERE user_id = ? OR (phone = ? AND ? != '') OR (email = ? AND ? != '')
                ORDER BY id DESC
            `, [userId, userPhone, userPhone, userEmail, userEmail], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 8. Fetch Wallet Transactions History
        const walletTransactions = await new Promise((resolve) => {
            connection.query(`
                SELECT wt.*, b.invoice_number, b.customer_name as booking_customer_name
                FROM wallet_transactions wt
                LEFT JOIN bookings b ON wt.booking_id = b.id
                WHERE wt.user_id = ?
                ORDER BY wt.id DESC
            `, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 9. Fetch Withdrawal Requests
        const withdrawalRequests = await new Promise((resolve) => {
            connection.query(`
                SELECT * FROM withdrawal_requests
                WHERE user_id = ?
                ORDER BY id DESC
            `, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 10. Fetch Referred Users Network (Users who signed up with this user's referral code)
        const referredUsers = await new Promise((resolve) => {
            connection.query(`
                SELECT id, first_name, last_name, email, phone, date, status, user_type
                FROM user_master
                WHERE referred_by_id = ?
                ORDER BY id DESC
            `, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // 11. Fetch Referral Transactions / Commissions
        const referralTransactions = await new Promise((resolve) => {
            connection.query(`
                SELECT rt.*,
                       ru.first_name as referred_first_name, ru.last_name as referred_last_name,
                       p.name as package_name
                FROM referral_transactions rt
                LEFT JOIN user_master ru ON rt.referred_user_id = ru.id
                LEFT JOIN packages_master p ON rt.package_id = p.id
                WHERE rt.referrer_id = ?
                ORDER BY rt.id DESC
            `, [userId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // Calculate summary KPIs
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, b) => sum + (parseFloat(b.total_cost) || 0), 0);
        const totalSaved = savedPackages.length;
        const totalEnquiries = holidayEnquiries.length + corporateEnquiries.length;
        const totalReferrals = referredUsers.length;
        const totalReferralEarnings = referralTransactions.reduce((sum, r) => sum + (parseFloat(r.commission_amount) || 0), 0);
        const totalWalletCredits = walletTransactions
            .filter(w => (w.type || '').toUpperCase() === 'CREDIT')
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
        const totalWalletDebits = walletTransactions
            .filter(w => (w.type || '').toUpperCase() === 'DEBIT')
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

        return res.status(200).json({
            status: true,
            msg: 'User details fetched successfully.',
            user,
            addresses,
            socials,
            saved_packages: savedPackages,
            bookings,
            holiday_enquiries: holidayEnquiries,
            corporate_enquiries: corporateEnquiries,
            wallet_transactions: walletTransactions,
            withdrawal_requests: withdrawalRequests,
            referred_users: referredUsers,
            referral_transactions: referralTransactions,
            stats: {
                total_bookings: totalBookings,
                total_spent: totalSpent,
                total_saved: totalSaved,
                total_enquiries: totalEnquiries,
                total_referrals: totalReferrals,
                total_referral_earnings: totalReferralEarnings,
                total_wallet_credits: totalWalletCredits,
                total_wallet_debits: totalWalletDebits
            }
        });
    } catch (error) {
        next(error);
    }
});

const getSearchUsers = asyncHandler(async (req, res, next) => {

    try {
        const condition = req?.body?.status ? { status: req?.body?.status, admin: 0 } : { admin: 0 };
        const users = await getSearchUsersModel(condition, req?.body?.searchData);
        return res.status(200).json({ status: true, msg: 'All Users..', users: users })
    } catch (error) {
        next(error)
    }
})



const getReferralOverview = asyncHandler(async (req, res, next) => {
    try {
        const referrers = await new Promise((resolve) => {
            const sql = `
                SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.referral_code, u.wallet_balance, u.user_type, u.created_at,
                    COUNT(DISTINCT ru.id) AS total_friends_referred,
                    COUNT(DISTINCT rt.id) AS total_referral_bookings,
                    COALESCE(SUM(rt.commission_amount), 0) AS total_commission_paid
                FROM user_master u
                JOIN user_master ru ON ru.referred_by_id = u.id
                LEFT JOIN referral_transactions rt ON rt.referrer_id = u.id
                GROUP BY u.id
                ORDER BY total_commission_paid DESC, total_friends_referred DESC
            `;
            connection.query(sql, (err, rows) => {
                resolve(rows || []);
            });
        });

        const transactions = await new Promise((resolve) => {
            const sql = `
                SELECT rt.*, 
                    ref.first_name AS referrer_first_name, ref.last_name AS referrer_last_name, ref.email AS referrer_email, ref.referral_code,
                    friend.first_name AS friend_first_name, friend.last_name AS friend_last_name, friend.email AS friend_email,
                    p.title AS package_title
                FROM referral_transactions rt
                LEFT JOIN user_master ref ON ref.id = rt.referrer_id
                LEFT JOIN user_master friend ON friend.id = rt.referred_user_id
                LEFT JOIN packages_master p ON p.id = rt.package_id
                ORDER BY rt.id DESC
            `;
            connection.query(sql, (err, rows) => {
                resolve(rows || []);
            });
        });

        return res.status(200).json({
            status: true,
            msg: 'Referral Overview loaded successfully.',
            referrers,
            transactions
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc Release wallet payout / withdraw funds from user wallet (Admin)
 * @route POST /admin/user/releaseWalletPayout
 */
const releaseWalletPayout = asyncHandler(async (req, res, next) => {
    try {
        const { user_id, amount, payment_method, transaction_ref, admin_remarks, bank_name, account_number, ifsc_code, upi_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ status: false, msg: 'User ID is required.' });
        }

        const payoutAmount = parseFloat(amount);
        if (isNaN(payoutAmount) || payoutAmount <= 0) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid payout amount greater than ₹0.' });
        }

        // 1. Fetch User Record to verify wallet balance
        const userRows = await new Promise((resolve, reject) => {
            connection.query('SELECT id, first_name, last_name, wallet_balance, phone, email, bank_name, account_number, ifsc_code, upi_id FROM user_master WHERE id = ?', [user_id], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        if (!userRows || userRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'User not found.' });
        }

        const user = userRows[0];
        const currentBalance = parseFloat(user.wallet_balance) || 0;

        if (payoutAmount > currentBalance) {
            return res.status(400).json({
                status: false,
                msg: `Insufficient wallet balance. Available balance is ₹${currentBalance.toLocaleString('en-IN')}, requested payout is ₹${payoutAmount.toLocaleString('en-IN')}.`
            });
        }

        const newBalance = currentBalance - payoutAmount;

        // 2. Deduct from user_master
        await new Promise((resolve, reject) => {
            connection.query('UPDATE user_master SET wallet_balance = ? WHERE id = ?', [newBalance, user_id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // 3. Record in wallet_transactions as DEBIT
        const description = `Wallet payout released via ${payment_method || 'Bank Transfer'}${transaction_ref ? ` (Ref: ${transaction_ref})` : ''}${admin_remarks ? ` - Note: ${admin_remarks}` : ''}`;
        await new Promise((resolve, reject) => {
            connection.query(`
                INSERT INTO wallet_transactions (user_id, amount, type, source, description, status, created_at)
                VALUES (?, ?, 'DEBIT', 'WITHDRAWAL', ?, 'COMPLETED', NOW())
            `, [user_id, payoutAmount, description], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // 4. Record in withdrawal_requests as COMPLETED
        await new Promise((resolve, reject) => {
            connection.query(`
                INSERT INTO withdrawal_requests (user_id, amount, account_holder, bank_name, account_number, ifsc_code, upi_id, status, admin_remarks, transaction_ref, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, NOW(), NOW())
            `, [
                user_id,
                payoutAmount,
                `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                bank_name || user.bank_name || null,
                account_number || user.account_number || null,
                ifsc_code || user.ifsc_code || null,
                upi_id || user.upi_id || null,
                admin_remarks || 'Wallet payout released by admin',
                transaction_ref || null
            ], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        return res.status(200).json({
            status: true,
            msg: `Successfully released ₹${payoutAmount.toLocaleString('en-IN')} payout to ${user.first_name || 'user'}.`,
            new_wallet_balance: newBalance,
            payout_amount: payoutAmount,
            transaction_ref: transaction_ref || null
        });
    } catch (error) {
        console.error('[releaseWalletPayout] error:', error);
        next(error);
    }
});

/**
 * @desc Process (Approve/Reject) a pending withdrawal request
 * @route POST /admin/user/processWithdrawalRequest
 */
const processWithdrawalRequest = asyncHandler(async (req, res, next) => {
    try {
        const { request_id, action, transaction_ref, admin_remarks } = req.body;

        if (!request_id || !action) {
            return res.status(400).json({ status: false, msg: 'Request ID and action (APPROVE/REJECT) are required.' });
        }

        const wrRows = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM withdrawal_requests WHERE id = ?', [request_id], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });

        if (!wrRows || wrRows.length === 0) {
            return res.status(404).json({ status: false, msg: 'Withdrawal request not found.' });
        }

        const wr = wrRows[0];
        const userId = wr.user_id;
        const amount = parseFloat(wr.amount);

        if (action.toUpperCase() === 'APPROVE') {
            // Deduct from wallet
            await new Promise((resolve, reject) => {
                connection.query('UPDATE user_master SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id = ?', [amount, userId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            // Insert wallet_transactions debit
            const desc = `Withdrawal request #${request_id} approved${transaction_ref ? ` (Ref: ${transaction_ref})` : ''}`;
            await new Promise((resolve, reject) => {
                connection.query(`
                    INSERT INTO wallet_transactions (user_id, amount, type, source, description, status, created_at)
                    VALUES (?, ?, 'DEBIT', 'WITHDRAWAL', ?, 'COMPLETED', NOW())
                `, [userId, amount, desc], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            // Update withdrawal_requests status
            await new Promise((resolve, reject) => {
                connection.query(`
                    UPDATE withdrawal_requests
                    SET status = 'COMPLETED', transaction_ref = ?, admin_remarks = ?, updated_at = NOW()
                    WHERE id = ?
                `, [transaction_ref || null, admin_remarks || null, request_id], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            return res.status(200).json({ status: true, msg: `Withdrawal request #${request_id} approved and completed.` });
        } else {
            // REJECT
            await new Promise((resolve, reject) => {
                connection.query(`
                    UPDATE withdrawal_requests
                    SET status = 'REJECTED', admin_remarks = ?, updated_at = NOW()
                    WHERE id = ?
                `, [admin_remarks || 'Rejected by admin', request_id], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            return res.status(200).json({ status: true, msg: `Withdrawal request #${request_id} rejected.` });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = { 
    getAllUser, 
    setUser, 
    deleteUser, 
    getAllAdminUser, 
    insertAdminUser, 
    userStatus, 
    getAllCustomerUser, 
    getParticularUser, 
    getSearchUsers, 
    getReferralOverview,
    getParticularAdminUser,
    updateAdminUser,
    releaseWalletPayout,
    processWithdrawalRequest
};