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
    getSearchUsersModel
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
        console.log(req?.body)
        if (!req?.body?.account_details || !req?.body?.account_details?.password || !req?.body?.account_details?.phone || (req?.body?.account_details?.password != req?.body?.account_details?.confirm_password)) {
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
        next(error);
    }
})

const getAllAdminUser = asyncHandler(async (req, res, next) => {
    try {
        const reporters = await getAllUserModel({ admin: 2 });
        return res.status(200).json({ status: true, msg: 'All reporters..', reporters: reporters })
    } catch (error) {
        next(error);
    }
})


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

module.exports = { getAllUser, setUser, deleteUser, getAllAdminUser, insertAdminUser, userStatus, getAllCustomerUser, getParticularUser, getSearchUsers, getReferralOverview }