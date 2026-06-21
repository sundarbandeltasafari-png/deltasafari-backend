const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
require('dotenv').config()
const crypto = require('crypto-js');
const {
    getAllPackagesModel,
    getAllPackagesDetails,
    createSubscription,
    getUserSubscriptionsModel,
    updateSubscription,
    createSearchHistoryModel,
    getSearchHistoryModel,
    getAllLanguagesModel,
    createContactModel,
    getRecentSearchHistoryModel,
    getSiteSettingsConditionModel,
    getContactChannelsConditionModel,
    getOfficesConditionModel
} = require('../../model/service/serviceModel');
// const { getGptAnswer } = require('../helper/gptHelper');
const { getTokenUser, setUserById } = require('../../model/auth/authModel');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const placeOrder = asyncHandler(async (req, res) => {
    try {
        if (req?.user && req?.body?.packageId) {
            var user = [req?.user];
            const packageDetails = await getAllPackagesDetails(req?.body.packageId);
            if (packageDetails && packageDetails.length > 0) {
                const amount = packageDetails[0]?.amount;
                const userId = user[0]?.id;
                const options = {
                    amount: amount * 100,
                    currency: "INR",
                    receipt: userId + '_' + Date.now(),
                    payment_capture: 1,
                    notes: {
                        userId: userId,
                        packageId: packageDetails[0]?.id
                    }
                };
                try {
                    const response = await razorpay.orders.create(options)
                    res.status(200).json({
                        status: true, order: {
                            order_id: response.id,
                            currency: response.currency,
                            amount: response.amount,
                        }
                    })
                } catch (err) {
                    res.status(400).send('Not able to create order. Please try again!');
                }
            } else {
                return res.status(400).json({ status: false, msg: 'Package not found!' });
            }
        }
        else if (req?.body?.packageId) {
            return res.status(400).json({ status: false, msg: 'Package not found!' });
        }
        else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const verifyOrder = asyncHandler(async (req, res) => {
    const body = req?.body
    if (body?.orderId) {
        try {
            const order = await razorpay.orders.fetch(body?.orderId);
            if (order) {
                const succeeded = crypto.HmacSHA256(`${body?.orderId}|${body?.paymentId}`, process.env.RAZORPAY_KEY_SECRET).toString() === body?.signature;
                const packageId = order?.notes?.packageId;
                const userId = order?.notes?.userId;
                const packageDetails = await getAllPackagesDetails(packageId);
                const currentDate = new Date();
                const futureDate = new Date(currentDate);
                if (packageDetails[0].type == 2) {
                    futureDate.setMonth(futureDate.getMonth() + 12);
                } else {
                    futureDate.setMonth(futureDate.getMonth() + 1);
                }
                console.log(order)
                if (succeeded && order.status == 'paid' && order.amount == packageDetails[0].amount * 100) {
                    const subscription = {
                        user_id: userId,
                        package_id: packageDetails[0].id,
                        mode: 'Razorpay',
                        amount: order?.amount / 100,
                        response: JSON.stringify(order),
                        expire_on: futureDate.getTime(),
                        total_request: packageDetails[0]?.total_request,
                        request_type: packageDetails[0]?.request_type,
                        type: packageDetails[0].type
                    }
                    await createSubscription(subscription);
                    return res.status(200).json({ status: true, msg: 'Payment successfull' })
                }
                else {
                    const subscription = {
                        user_id: userId,
                        package_id: packageDetails[0].id,
                        mode: 'Razorpay',
                        amount: order?.amount / 100,
                        response: JSON.stringify(order),
                        expire_on: Date.now(),
                        total_request: 0,
                        type: packageDetails[0].type,
                        request_type: packageDetails[0]?.request_type,
                        status: 0
                    }
                    await createSubscription(subscription);
                    return res.status(400).json({ status: false, msg: 'Payment failed.' })
                }
            }
        } catch (err) {
            console.log(err);
            res.status(400).send('Not able to recive order. Please try again!');
        }
    } else {
        return res.status(500).json({ status: false, msg: 'No order id found!' })
    }
})

const getAllPackage = asyncHandler(async (req, res) => {
    try {
        const packages = await getAllPackagesModel();
        return res.status(200).json({ status: true, msg: 'All packages..', packages: packages })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


const createContact = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.name && !req?.body?.email && !req?.body?.message) {
            return res.status(400).json({ status: false, msg: 'Please enter all required fields.' })
        }
        const subjects = await createContactModel({ name: req?.body?.name, email: req?.body?.email, message: req?.body?.message });
        return res.status(200).json({ status: true, msg: 'Subject created successfully..', subjects: subjects })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getRecentSearchHistory = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            const date = new Date()
            const likeDate = date.getFullYear() + "-" + (date.getMonth() + 1);
            // console.log(likeDate)
            const history = await getRecentSearchHistoryModel(req?.user?.id, likeDate);
            return res.status(200).json({ status: true, msg: 'All Search Histories..', history: history })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


// Site Settings
const getSiteSettings = asyncHandler(async (req, res, next) => {
    try {
        const siteSettings = await getSiteSettingsConditionModel({ id: 1 });
        const contacts = await getContactChannelsConditionModel();
        const offices = await getOfficesConditionModel({office_type: 'Head office'});
        siteSettings.contacts = contacts;
        siteSettings.offices = offices;
        return res.status(200).json({ status: true, msg: 'Site settings found!', siteSettings: siteSettings })
    } catch (error) {
        next(error)
    }
})




module.exports = {
    placeOrder,
    verifyOrder,
    getAllPackage,
    createContact,
    getRecentSearchHistory,
    getSiteSettings
}