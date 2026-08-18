const asyncHandler = require('express-async-handler');
const { createUser, setUser, setUserByOtp, getParticularUserDetails } = require('../../model/auth/authModel');
const md5 = require('md5');
const { getToken } = require('../../middleware/jwtMiddleware');
const { sendOtp, validateEmail, isValidPhoneNumber, generateReferralCode } = require('../../helper/serviceHelper');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : undefined);


const register = asyncHandler(async (req, res) => {
    try {
        const body = req?.body;
        const user = await getParticularUserDetails({ email: body?.email }, { phone: body?.email });
        const email = validateEmail(body?.email) ? body?.email : "";
        const phone = isValidPhoneNumber(body?.email) ? body?.email : "";
        if (user.length == 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);

            // Resolve referrer if referral_code or ref is provided
            let referredById = null;
            const refCode = (body?.referral_code || body?.ref || body?.referralCode || '').toString().trim().toUpperCase();
            if (refCode) {
                const referrerRows = await new Promise((resolve) => {
                    connection.query('SELECT id FROM user_master WHERE UPPER(referral_code) = ? LIMIT 1', [refCode], (err, rows) => {
                        resolve(rows || []);
                    });
                });
                if (referrerRows.length > 0) {
                    referredById = referrerRows[0].id;
                }
            }

            const myReferralCode = 'DS-' + generateReferralCode(6).toUpperCase();
            const userTypeNum = Number(body?.user_type) || 1;
            const isAgentReg = userTypeNum === 3;
            const initialStatus = isAgentReg ? 0 : 1; // Agent accounts require Admin activation

            const userData = {
                first_name: body?.first_name,
                last_name: body?.last_name,
                email: email,
                phone: phone,
                password: md5(body?.password),
                otp: otp,
                user_type: userTypeNum,
                referral_code: myReferralCode,
                referred_by_id: referredById,
                status: initialStatus
            };
            await createUser(userData);
            sendOtp(email, `${body?.first_name} ${body?.last_name}`, otp, 'register');

            if (isAgentReg) {
                return res.status(201).json({
                    status: true,
                    msg: 'Agent Partner account registered successfully! Your account is currently pending Admin verification and activation. You will be able to log in once approved by Admin.'
                });
            }

            return res.status(201).json({ status: true, msg: 'User has been registered successfully, Please verify OTP!' });
        } else {
            return res.status(400).json({ status: false, msg: 'User already registered.' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ status: false, otp: "", msg: 'Something went wrong, please try again later' });
    }
});

const registerOtpValidate = asyncHandler(async (req, res) => {
    const body = req?.body
    try {
        const user = await getParticularUserDetails({ email: body?.email, otp: body?.otp }, { phone: body?.email, otp: body?.otp });
        if (user.length > 0) {
            await setUser({ status: 1, otp: ''  }, body?.email);
            return res.status(201).json({ status: true, msg: 'User is active, please login to continue.' });
        } else {
            return res.status(400).json({ status: false, msg: 'Invalid otp!' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const login = asyncHandler(async (req, res) => {
    try {

        const body = req?.body
        if (!body?.email && !body?.password) {
            return res.status(400).json({ status: false, msg: 'Please add user email and password.' });
        }
        var user = [];
        const userdata = await getParticularUserDetails({ email: body?.email, password: md5(body?.password) }, { phone: body?.email, password: md5(body?.password) });
        if(userdata.length == 0){
            return res.status(400).json({ status: false, msg: 'User credentials is not valid.' });
        }
        user = userdata[0];
        
        // Agent Account Verification Check (user_type === 3)
        if (Number(user.user_type) === 3 && Number(user.status) !== 1) {
            return res.status(403).json({
                status: false,
                msg: 'Your Agent Partner account is currently pending Admin verification and activation. Please wait for Admin approval before logging in.'
            });
        }

        if (user.status == 1) {
            const userDetails = { id: user?.id, first_name: user?.first_name, last_name: user?.last_name, email: user?.email, phone: user?.phone, user_type: user?.user_type }
            const loginToken = getToken(userDetails);
            return res.status(200).json({ status: true, otpVerify: false, msg: 'User has been logged in successfully!', token: loginToken?.token, userDetails: userDetails });
        } else if(user.status == 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            sendOtp(body?.email, `${user?.first_name} ${user?.last_name}`, otp, 'register');
            return res.status(200).json({ status: true, otpVerify: true, msg: 'Please validate your OTP to login.' });
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const resetPasswordLink = asyncHandler(async (req, res) => {
    const email = (req?.body?.email || '').trim();
    if (!email) {
        return res.status(400).json({ status: false, msg: 'Please enter your registered email address.' });
    }
    try {
        const user = await getParticularUserDetails({ email: email }, { phone: email });
        if (user && user.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            await setUser({ otp: otp }, email);
            const recipientName = user[0]?.first_name 
                ? `${user[0].first_name} ${user[0].last_name || ''}`.trim() 
                : (user[0]?.name || 'Valued Traveler');
            
            sendOtp(user[0]?.email || email, recipientName, otp, 'reset');
            return res.status(200).json({ status: true, msg: 'Password reset OTP has been sent to your email address successfully!' });
        } else {
            return res.status(404).json({ status: false, msg: 'No account found with this email address. Please check and try again.' });
        }
    } catch (error) {
        console.error('resetPasswordLink Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const verifyResetOtp = asyncHandler(async (req, res) => {
    const email = (req?.body?.email || '').trim();
    const otp = (req?.body?.otp || '').toString().trim();
    if (!email || !otp) {
        return res.status(400).json({ status: false, msg: 'Email and OTP are required.' });
    }
    try {
        const user = await getParticularUserDetails({ email: email, otp: otp }, { phone: email, otp: otp });
        if (user && user.length > 0) {
            return res.status(200).json({ status: true, msg: 'OTP verified successfully! Please enter your new password.' });
        } else {
            return res.status(400).json({ status: false, msg: 'Invalid or expired OTP. Please check the code and try again.' });
        }
    } catch (error) {
        console.error('verifyResetOtp Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const body = req?.body;
    const email = (body?.email || '').trim();
    const otp = (body?.otp || '').toString().trim();
    const password = body?.password || '';
    const confirmPassword = body?.confirmPassword || '';

    if (!email || !otp) {
        return res.status(400).json({ status: false, msg: 'Email and OTP are required.' });
    }

    if (!password || !confirmPassword) {
        return res.status(400).json({ status: false, msg: 'Please provide both new password and confirm password.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ status: false, msg: 'Password and Confirm Password do not match.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ status: false, msg: 'Password must be at least 6 characters long.' });
    }

    try {
        const user = await getParticularUserDetails({ email: email, otp: otp }, { phone: email, otp: otp });
        if (user && user.length > 0) {
            await setUserByOtp({ password: md5(password) }, email, otp);
            await setUser({ otp: '' }, email);
            return res.status(200).json({ status: true, msg: 'Your password has been reset successfully! You can now log in.' });
        } else {
            return res.status(400).json({ status: false, msg: 'Invalid or expired OTP. Please request a new OTP.' });
        }
    } catch (error) {
        console.error('resetPassword Error:', error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const resendResetOtp = asyncHandler(async (req, res) => {
    const email = (req?.body?.email || '').trim();
    if (!email) {
        return res.status(400).json({ status: false, msg: 'Please enter your email address.' });
    }
    try {
        const user = await getParticularUserDetails({ email: email }, { phone: email });
        if (!user || user.length === 0) {
            return res.status(404).json({ status: false, msg: 'No account found with this email address.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        await setUser({ otp: otp }, email);
        const recipientName = user[0]?.first_name 
            ? `${user[0].first_name} ${user[0].last_name || ''}`.trim() 
            : (user[0]?.name || 'Valued Traveler');
        
        sendOtp(user[0]?.email || email, recipientName, otp, 'reset');
        return res.status(200).json({ status: true, msg: 'A new password reset OTP has been sent to your email.' });
    } catch (err) {
        console.error('resendResetOtp Error:', err);
        return res.status(500).json({ status: false, msg: 'Failed to resend OTP. Please try again.' });
    }
});

const resendOtp = asyncHandler(async (req, res) => {
    const body = req?.body;
    const email = (body?.email || '').trim();
    if (!email) {
        return res.status(400).json({ status: false, msg: 'User credentials is not valid.' });
    }
    try {
        const user = await getParticularUserDetails({ email: email }, { phone: email });
        if (!user || user.length === 0) {
            return res.status(404).json({ status: false, msg: 'Invalid user.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        await setUser({ otp: otp }, user[0]?.email ? user[0]?.email : user[0]?.phone);
        sendOtp(user[0]?.email ? user[0]?.email : user[0]?.phone, `${user[0]?.first_name || ''} ${user[0]?.last_name || ''}`.trim() || 'Valued Traveler', otp, 'login-with-otp');
        return res.status(200).json({ status: true, msg: 'OTP has been sent, please verify your OTP.' });
    } catch (err) {
        return res.status(500).json({ status: false, msg: 'Failed to resend OTP.' });
    }
});


// Login Code ....
const loginOTP = asyncHandler(async (req, res) => {
    const body = req?.body
    if (!body?.loginWithOtp) {
        if (!body?.email && !body?.password) {
            return res.status(500).json({ status: false, msg: 'User credentials is not valid.' });
        }
        var user = [];
        try {
            user = await getParticularUserDetails({ email: body?.email, password: md5(body?.password) }, { phone: body?.email, password: md5(body?.password) });
        } catch (err) {
            return res.status(500).json({ status: false, msg: 'User credentials is not valid.' })
        }
        if (user.length > 0 && user[0].status == 1) {
            const userDetails = { id: user[0]?.id, first_name: user[0]?.first_name, last_name: user[0]?.last_name, email: user[0]?.email, phone: user[0]?.phone }
            const loginToken = getToken(userDetails);
            return res.status(200).json({ status: true, otpVerify: false, msg: 'User has been logged in successfully!', token: loginToken?.token, userDetails: userDetails });
        }
    }
    else {
        var user = [];
        try {
            user = await getParticularUserDetails({ email: body?.email }, { phone: body?.email });
        } catch (err) {
            return res.status(500).json({ status: false, msg: 'User credentials is not valid.' })
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        await setUser({ otp: otp }, user[0]?.email ? user[0]?.email : user[0]?.phone);
        sendOtp(user[0]?.email ? user[0]?.email : user[0]?.phone, `${user[0]?.first_name} ${user[0]?.last_name}`, otp, 'login-otp');
        return res.status(200).json({ status: true, otpVerify: true, msg: 'Please verify OTP to login.' })
    }
})
const loginOtpValidate = asyncHandler(async (req, res) => {
    const body = req?.body
    try {
        const user = await getParticularUserDetails({ email: body?.email, otp: body?.otp }, { phone: body?.email, otp: body?.otp });
        if (user.length > 0) {
            await setUser({ status: 1 }, body?.email);
            await setUser({ otp: '' }, body?.email);
            const userDetails = { id: user[0]?.id, first_name: user[0]?.first_name, last_name: user[0]?.last_name, email: user[0]?.email, phone: user[0]?.phone }
            const loginToken = getToken(userDetails);
            return res.status(200).json({ status: true, userVerified: 'verified', msg: 'User has been logged in successfully!', token: loginToken?.token, userDetails: userDetails })
        } else {
            return res.status(200).json({ status: false, msg: 'Invalid otp! Please try again.' })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})



const googleLogin = asyncHandler(async (req, res) => {
    try {
        const body = req?.body || {};
        const token = body?.token || body?.credential || body?.idToken;
        const type = Number(body?.type) || 1; // 1 = Customer, 2 = Corporate, 3 = Agent

        let email = body?.email;
        let first_name = body?.first_name;
        let last_name = body?.last_name;
        let google_id = body?.google_id;

        if (!token) {
            return res.status(400).json({ status: false, msg: 'Google authorization credential/token is required for backend validation.' });
        }

        // Backend validation of Google ID token with Google's public key certificate
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : undefined
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                return res.status(400).json({ status: false, msg: 'Invalid Google token payload. Email missing from token.' });
            }
            if (payload.email_verified === false) {
                return res.status(400).json({ status: false, msg: 'Google account email is not verified.' });
            }

            email = payload.email;
            first_name = payload.given_name || payload.name?.split(' ')[0] || email.split('@')[0];
            last_name = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
            google_id = payload.sub;
        } catch (authErr) {
            console.error('Google ID token verification failed:', authErr.message);
            return res.status(401).json({ status: false, msg: `Google OAuth verification failed: ${authErr.message}` });
        }

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ status: false, msg: 'Valid email is required for Google login.' });
        }

        let userList = await getParticularUserDetails({ email: email }, { phone: email });
        let user;

        if (userList && userList.length > 0) {
            user = userList[0];
            if (!user.user_type) {
                await setUser({ user_type: type }, email);
                user.user_type = type;
            }
        } else {
            // Resolve referrer if referral_code or ref is provided
            let referredById = null;
            const refCode = (body?.referral_code || body?.ref || body?.referralCode || '').toString().trim().toUpperCase();
            if (refCode) {
                const referrerRows = await new Promise((resolve) => {
                    connection.query('SELECT id FROM user_master WHERE UPPER(referral_code) = ? LIMIT 1', [refCode], (err, rows) => {
                        resolve(rows || []);
                    });
                });
                if (referrerRows.length > 0) {
                    referredById = referrerRows[0].id;
                }
            }

            const myReferralCode = 'DS-' + generateReferralCode(6).toUpperCase();

            const userData = {
                first_name: first_name || body?.name?.split(' ')[0] || email.split('@')[0],
                last_name: last_name || body?.name?.split(' ').slice(1).join(' ') || '',
                email: email,
                phone: body?.phone || '',
                user_type: type,
                google_id: google_id || '',
                referral_code: myReferralCode,
                referred_by_id: referredById,
                status: 1
            };
            await createUser(userData);
            const freshUserList = await getParticularUserDetails({ email: email }, { phone: email });
            user = freshUserList[0] || userData;
        }

        const userDetails = {
            id: user?.id,
            first_name: user?.first_name,
            last_name: user?.last_name,
            email: user?.email,
            phone: user?.phone,
            user_type: type
        };

        const loginToken = getToken(userDetails);
        const typeLabel = type === 1 ? 'Customer' : type === 2 ? 'Corporate' : 'Agent';

        return res.status(200).json({
            status: true,
            msg: `Google login successful as ${typeLabel}!`,
            token: loginToken?.token,
            userDetails: userDetails
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        return res.status(500).json({ status: false, msg: 'Google Auth failed. Please try again.' });
    }
});

module.exports = { 
    register, 
    registerOtpValidate, 
    login, 
    loginOtpValidate, 
    resetPasswordLink, 
    verifyResetOtp,
    resetPassword, 
    resendResetOtp,
    resendOtp, 
    googleLogin 
};