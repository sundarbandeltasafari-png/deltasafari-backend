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
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


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

module.exports = { getUserSubscription, getUserSubscriptionHistory, viewProfile, editProfile, changePassword };