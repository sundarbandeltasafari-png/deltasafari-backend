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
        const users = await getSearchUsersModel({ admin: 0 }, req?.body?.searchData);
        return res.status(200).json({ status: true, msg: 'All Users..', users: users })
    } catch (error) {
        next(error)
    }
})



module.exports = { getAllUser, setUser, deleteUser, getAllAdminUser, insertAdminUser, userStatus, getAllCustomerUser, getParticularUser, getSearchUsers }