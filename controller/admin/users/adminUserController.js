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
        const id = req?.query?.id;
        if (!id) {
            const error = new Error('Please enter a valid user.');
            res.status(400);
            next(error);
        }
        const users = await getParticularUserModel({ id: urlDecode(id) });
        return res.status(200).json({ status: true, msg: 'Particuler User..', user: users.length > 0 ? users[0] : null })
    } catch (error) {
        next(error)
    }
})

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
    updateAdminUser
};