const asyncHandler = require('express-async-handler');

const { setUserById } = require('../../model/auth/authModel');
const { getUserSubscriptionModel, getParticularUser, updateUser } = require('../../model/user/userModel');

const viewProfile = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            var user = [req?.user];
            const loginUser = await getParticularUser(user[0]?.id, user[0]?.email ? user[0]?.email : user[0]?.phone);
            return res.status(200).json({ status: true, msg: 'User Details.', userDetails: { ...loginUser[0], password: '' } })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const editProfile = asyncHandler(async (req, res) => {
    try {
        if (req?.user) {
            var user = [req?.user];
            const editDetails = {
                first_name: req?.body?.first_name,
                last_name: req?.body?.last_name,
                board: req?.body?.board,
                medium: req?.body?.medium
            }
            if(!editDetails?.first_name || !editDetails?.last_name || !editDetails?.board || !editDetails?.medium){
                return res.status(400).json({ status: false, msg: 'Please add all valid fields!' });
            }
            await updateUser(editDetails, user[0]?.id);
            return res.status(200).json({ status: true, msg: 'User Profile updated successfully!' })
        } else {
            return res.status(400).json({ status: false, msg: 'User not found!' });
        }
    } catch (error) {
        // console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

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
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


module.exports = { getUserSubscription, getUserSubscriptionHistory, viewProfile, editProfile };