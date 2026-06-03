const asyncHandler = require('express-async-handler');
const { getParticularUser, createUser, setUser, setUserByOtp, setUserById, getParticularUserDetails } = require('../../model/auth/authModel');
const md5 = require('md5');
const { getToken } = require('../../middleware/jwtMiddleware');
const { sendOtp, validateEmail, isValidPhoneNumber, generateReferralCode } = require('../../helper/serviceHelper');


const register = asyncHandler(async (req, res) => {
    try {
        const body = req?.body
        const user = await getParticularUser(body?.email);
        // console.log(user)
        const email = validateEmail(body?.email) ? body?.email : "";
        const phone = isValidPhoneNumber(body?.email) ? body?.email : "";
        if (user.length == 0) {
            if (!body?.first_name || !body?.last_name || !body?.email || !body?.password || !body?.subject || !body?.medium || !body?.board) {
                return res.status(400).json({ status: false, msg: 'Please enter all required fields!' })
            }
            const otp = Math.floor(100000 + Math.random() * 900000);
            const userData = {
                first_name: body?.first_name,
                last_name: body?.last_name,
                email: email,
                phone: phone,
                password: md5(body?.password),
                subject: body?.subject,
                medium: body?.medium,
                referralcode: body?.referralcode,
                board: body?.board,
                level: body?.level,
                otp: otp
            };
            await createUser(userData);
            var userDetails = await getParticularUserDetails({ email: email, password: md5(body?.password) }, { phone: email, password: md5(body?.password) });
            if (userDetails.length == 0) {
                return res.status(500).json({ status: false, msg: 'User not registered, Please try again later.' })
            }
            userDetails = userDetails[0]
            const length = userDetails?.id.toString().length > 4 ? 4 : 8 - userDetails?.id.toString().length;
            const referralCode = generateReferralCode(length);
            await setUser({ otp: otp, referral: referralCode + (userDetails?.id.toString().length > 4 ? Number(userDetails?.id.toString().slice(-4)) : userDetails?.id) }, body?.email);
            sendOtp(body?.email, `${body?.first_name} ${body?.last_name}`, otp, 'register');
            return res.status(201).json({ status: true, verified: 'optsend', msg: 'User has been registered successfully!' })
        } else {
            const verifiedUser = await getParticularUserDetails({ email: body?.email, status: 1 }, { phone: body?.email, status: 1 });
            if (verifiedUser.length > 0) {
                return res.status(400).json({ status: false, verified: 'verified', msg: 'User already registered.' })
            }
            const otp = Math.floor(100000 + Math.random() * 900000);
            await setUser({ otp: otp }, body?.email);
            sendOtp(body?.email, `${body?.first_name} ${body?.last_name}`, otp, 'register');
            return res.status(400).json({ status: true, verified: 'optresend', msg: 'User already registered but not verified.' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong, please try again later' })
    }
})

const registerOtpValidate = asyncHandler(async (req, res) => {
    const body = req?.body
    try {
        const user = await getParticularUserDetails({ email: body?.email, otp: body?.otp }, { phone: body?.email, otp: body?.otp });
        if (user.length > 0) {
            await setUser({ status: 1 }, body?.email);
            await setUser({ otp: '' }, body?.email);
            return res.status(201).json({ status: true, msg: 'User is active, please login to continue.' });
        } else {
            return res.status(400).json({ status: false, msg: 'Invalid otp!' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


// Login Code ....
const login = asyncHandler(async (req, res) => {
    const body = req?.body
    if (!body?.loginWithOtp) {
        if (!body?.email && !body?.password) {
            return res.status(500).json({ status: false, msg: 'User credentials is not valid.' });
        }
        var user = [];
        try {
            user = await getParticularUser({ email: body?.email, password: md5(body?.password) }, { phone: body?.email, password: md5(body?.password) });
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
            user = await getParticularUser({ email: body?.email}, { phone: body?.email});
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

const resetPasswordLink = asyncHandler(async (req, res) => {
    const body = req?.body
    try {
        const user = await getParticularUser(body?.email);
        if (user?.length > 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            await setUser({ otp: otp }, body?.email);
            sendOtp(user[0]?.email, user[0]?.name, otp, 'reset');
            return res.status(201).json({ status: true, msg: 'Password reset mail has been send successfully!' })
        } else {
            return res.status(400).json({ status: false, msg: 'User Not Found.' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const resetPassword = asyncHandler(async (req, res) => {
    const body = req?.body
    try {
        const user = await getParticularUserDetails({ email: body?.email, otp: body?.otp }, { phone: body?.email, otp: body?.otp });
        if (user.length > 0) {
            if (body?.password && (body?.password == body?.confirmPassword)) {
                const userPass = await setUserByOtp({ password: md5(body?.password) }, body?.email, body?.otp);
                await setUser({ otp: '' }, body?.email);
                return res.status(201).json({ status: true, msg: 'Password has been updated successfully!' })
            } else {
                return res.status(400).json({ status: false, msg: 'Password and Confirm Password should be same.' })
            }
        } else {
            return res.status(400).json({ status: false, msg: 'Invalid otp!' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const resendOtp = asyncHandler(async (req, res) => {
    const body = req?.body
    if (!body?.email) {
        return res.status(500).json({ status: false, msg: 'User credentials is not valid.' });
    }
    try {
        var user = await getParticularUser({ email: body?.email }, { phone: body?.email });
        const otp = Math.floor(100000 + Math.random() * 900000);
        await setUser({ otp: otp }, user[0]?.email ? user[0]?.email : user[0]?.phone);
        sendOtp(user[0]?.email ? user[0]?.email : user[0]?.phone, `${user[0]?.first_name} ${user[0]?.last_name}`, otp, 'login-with-otp');
        return res.status(200).json({ status: true, msg: 'OTP has been send, Please verify your OTP.' })
    } catch (err) {
        return res.status(500).json({ status: false, msg: 'User credentials is not valid.' })
    }
})



// Old Code...
const registerPartials = asyncHandler(async (req, res) => {
    try {
        const body = req?.body
        const user = await getParticularUser(body?.email);
        const email = validateEmail(body?.email) ? body?.email : "";
        const phone = isValidPhoneNumber(body?.email) ? body?.email : "";
        if (user.length == 0) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const userData = {
                first_name: body?.first_name,
                last_name: body?.last_name,
                email: email,
                phone: phone,
                password: md5(body?.password),
                otp: otp,
                status: 1
            };
            await createUser(userData);
            return res.status(201).json({ status: true, otp: otp, msg: 'User has been registered successfully!' })
        } else {
            return res.status(400).json({ status: false, msg: 'User already registered.' })
        }
    } catch (error) {
        return res.status(500).json({ status: false, otp: "", msg: 'Something went wrong, please try again later' })
    }
})

const validatePartials = asyncHandler(async (req, res) => {
    try {
        var body = req?.body;
        const user = await getParticularUserDetails({ email: email, otp: body?.otp }, { phone: email, otp: body?.otp });
        if (user) {
            const editDetails = {
                medium: body?.medium,
                level: body?.level,
                board: body?.board,
            }
            if (!editDetails?.medium || !editDetails?.level || !editDetails?.board) {
                return res.status(400).json({ status: false, msg: 'Please add all valid fields!' });
            }
            await setUserById(editDetails, user[0]?.id);
            const userDetails = { id: user[0]?.id, first_name: user[0]?.first_name, last_name: user[0]?.last_name, email: user[0]?.email }
            const loginToken = getToken({ id: user[0]?.id, first_name: user[0]?.first_name, last_name: user[0]?.last_name, email: user[0]?.email });
            return res.status(200).json({ status: true, msg: 'User Profile updated successfully!', token: loginToken?.token, userDetails: userDetails })
        } else {
            return res.status(400).json({ status: true, msg: 'User not found!' })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

module.exports = { register, registerOtpValidate, login, loginOtpValidate, resetPasswordLink, resetPassword, resendOtp, registerPartials, validatePartials }