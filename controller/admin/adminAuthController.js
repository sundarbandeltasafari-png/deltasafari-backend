const asyncHandler = require('express-async-handler');
const { getParticularUser, getLoginUser, getOTPUser, setUser, setUserByOtp, getTokenUser } = require('../../model/admin/adminAuthModel');
const md5 = require('md5');
const { getToken } = require('../../middleware/jwtMiddleware');
const { sendOtp, validateEmail } = require('../../helper/serviceHelper');

const login = asyncHandler(async (req, res, next) => {
    try {
        let user = [req?.user];
        if (!req?.user) {
            const body = req?.body;
            if (!body?.email || !body?.password) {
                return res.status(400).json({ status: false, msg: 'Please provide both email address and password.' });
            }
            user = await getLoginUser(body?.email.trim(), md5(body?.password));
        }
        if (!user || user.length === 0) {
            return res.status(401).json({ status: false, msg: 'Invalid administrator credentials. Please check email and password.' });
        }
        const userDetails = { ...user[0], password: '' };
        const loginToken = getToken(userDetails);
        return res.status(200).json({ status: true, msg: 'Admin logged in successfully!', token: loginToken?.token, userDetails: userDetails });
    } catch (error) {
        return res.status(500).json({ status: false, msg: error?.message || 'Authentication error.' });
    }
});

const resetPasswordLink = asyncHandler(async (req, res, next) => {
    try {
        const email = (req?.body?.email || '').trim();
        if (!email) {
            return res.status(400).json({ status: false, msg: 'Please enter your administrator email address.' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid email address.' });
        }

        const user = await getParticularUser(email);
        if (!user || user.length === 0) {
            return res.status(404).json({ status: false, msg: 'No administrator account found with this email address.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log(`[Admin Forgot Password] OTP generated for ${email}: ${otp}`);

        await setUser({ otp: otp }, email);
        const recipientName = user[0]?.name || `${user[0]?.first_name || ''} ${user[0]?.last_name || ''}`.trim() || 'Admin';
        
        sendOtp(email, recipientName, otp, 'reset');

        return res.status(200).json({ status: true, msg: 'Password reset OTP has been sent to your email successfully!' });
    } catch (error) {
        console.error('Admin resetPasswordLink Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to send reset email. Please try again later.' });
    }
});

const verifyOtp = asyncHandler(async (req, res) => {
    try {
        const email = (req?.body?.email || '').trim();
        const otp = (req?.body?.otp || '').toString().trim();

        if (!email || !otp) {
            return res.status(400).json({ status: false, msg: 'Email and OTP are required.' });
        }

        const user = await getOTPUser(email, otp);
        if (!user || user.length === 0) {
            return res.status(400).json({ status: false, msg: 'Invalid or expired OTP. Please check the code and try again.' });
        }

        return res.status(200).json({ status: true, msg: 'OTP verified successfully! Please enter your new password.' });
    } catch (error) {
        console.error('Admin verifyOtp Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to verify OTP. Please try again later.' });
    }
});

const otpvalidate = asyncHandler(async (req, res, next) => {
    try {
        const body = req?.body;
        const email = (body?.email || '').trim();
        const otp = (body?.otp || '').toString().trim();
        const password = body?.password || '';
        const confirmPassword = body?.confirmPassword || '';

        if (!email || !otp) {
            return res.status(400).json({ status: false, msg: 'Email and OTP are required.' });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({ status: false, msg: 'Please provide both new password and confirmation password.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ status: false, msg: 'Password and Confirm Password do not match.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ status: false, msg: 'Password must be at least 6 characters long.' });
        }

        const user = await getOTPUser(email, otp);
        if (!user || user.length === 0) {
            return res.status(400).json({ status: false, msg: 'Invalid or expired OTP. Please request a new code.' });
        }

        await setUserByOtp({ password: md5(password) }, email, otp);
        await setUser({ otp: '' }, email);

        return res.status(200).json({ status: true, msg: 'Admin password has been reset successfully! You can now log in.' });
    } catch (error) {
        console.error('Admin otpvalidate Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to update password. Please try again later.' });
    }
});

const resendOtp = asyncHandler(async (req, res) => {
    try {
        const email = (req?.body?.email || '').trim();
        if (!email) {
            return res.status(400).json({ status: false, msg: 'Please provide your administrator email address.' });
        }

        const user = await getParticularUser(email);
        if (!user || user.length === 0) {
            return res.status(404).json({ status: false, msg: 'No administrator account found with this email address.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        await setUser({ otp: otp }, email);
        const recipientName = user[0]?.name || `${user[0]?.first_name || ''} ${user[0]?.last_name || ''}`.trim() || 'Admin';

        sendOtp(email, recipientName, otp, 'reset');

        return res.status(200).json({ status: true, msg: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('Admin resendOtp Error:', error);
        return res.status(500).json({ status: false, msg: 'Failed to resend OTP. Please try again.' });
    }
});

const viewProfile = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.user) {
            return res.status(401).json({ status: false, msg: 'User not authenticated.' });
        }
        const user = [req?.user];
        const loginUser = await getTokenUser(user[0]?.id, user[0]?.email);
        return res.status(200).json({ status: true, msg: 'User Details.', userDetails: { ...loginUser[0], password: '' } });
    } catch (error) {
        return res.status(500).json({ status: false, msg: error?.message || 'Server error.' });
    }
});

module.exports = { login, resetPasswordLink, verifyOtp, otpvalidate, resendOtp, viewProfile };