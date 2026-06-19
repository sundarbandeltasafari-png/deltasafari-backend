const asyncHandler = require('express-async-handler');
const { getParticularUser, getLoginUser, getOTPUser, setUser, setUserByOtp, getTokenUser } = require('../../model/admin/adminAuthModel');
const md5 = require('md5');
const { getToken } = require('../../middleware/jwtMiddleware');
const { sendOtp } = require('../../helper/serviceHelper');

const login = asyncHandler(async (req, res, next) => {
    try {
        var user = [req?.user]
        if (!req?.user) {
            const body = req?.body
            user = await getLoginUser(body?.email, md5(body?.password));
        }
        console.log(user)
        if (user.length == 0) {
            const error = new Error('User credentials is not valid.');
            // res.status(401);
            next(error);
        }
        const userDetails = { ...user[0], password: '' }
        const loginToken = getToken(userDetails);
        // res.cookie('server_sid', loginToken?.token, { httpOnly: true });
        return res.status(200).json({ status: true, msg: 'User has been logged in successfully!', token: loginToken?.token, userDetails: userDetails })
    } catch (error) {
        next(error)
    }
})

const resetPasswordLink = asyncHandler(async (req, res, next) => {
    try {
        const body = req?.body
        const user = await getParticularUser(body?.email);
        if (user?.length == 0) {
            const error = new Error('User not found.');
            res.status(401);
            next(error);
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log("Admin reset password", otp)
        await setUser({ otp: otp }, body?.email);
        sendOtp(body?.email, user[0]?.name, otp, 'reset');
        return res.status(201).json({ status: true, msg: 'Password reset mail has been send successfully!' })
    } catch (error) {
        next(error);
    }
})

const otpvalidate = asyncHandler(async (req, res, next) => {
    try {
        const body = req?.body
        const user = await getOTPUser(body?.email, body?.otp);
        if (user.length == 0) {
            const error = new Error('Invalid OTP.');
            res.status(400);
            next(error);
        }
        if (body?.password && (body?.password == body?.confirmPassword)) {
            const userPass = await setUserByOtp({ password: md5(body?.password) }, body?.email, body?.otp);
            await setUser({ otp: '' }, body?.email);
            return res.status(201).json({ status: true, msg: 'Password has been updated successfully!' })
        } else {
            const error = new Error('Password and Confirm Password should be same.');
            res.status(400);
            next(error);
        }
    } catch (error) {
        next(error)
    }
})

const viewProfile = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.user) {
            const error = new Error('User not valid.');
            res.status(400);
            next(error);
        }
        var user = [req?.user];
        const loginUser = await getTokenUser(user[0]?.id, user[0]?.email);
        return res.status(200).json({ status: true, msg: 'User Details.', userDetails: { ...loginUser[0], password: '' } })
    } catch (error) {
        next(error);
    }
})

module.exports = { login, resetPasswordLink, otpvalidate, viewProfile }