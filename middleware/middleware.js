const asyncHandler = require('express-async-handler');
const { validateToken } = require('./jwtMiddleware');
const { getParticularUser } = require('../model/admin/adminAuthModel');
const { getParticularUserDetails } = require('../model/auth/authModel');

const authMiddleWare = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split('Bearer ')[1];
        const userData = validateToken(token);
        if (!userData.status) {
            return res.status(400).json({ status: false, msg: 'Invalid authentication.' })
        }
        const userDetails = await getParticularUserDetails({id: userData?.data?.id, email: userData?.data?.email}, {id: userData?.data?.id, phone: userData?.data?.email});
        req.user = userDetails[0];
        next();
    } else {
        res.status(401).send('Unauthorized: Bearer token missing');
    }
});


const adminAuthMiddleWare = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split('Bearer ')[1];
        const userDetails = validateToken(token);
        if (!userDetails.status) {
            return res.status(400).json({ status: false, msg: 'Invalid authentication.' })
        }
        const adminUser = await getParticularUser(userDetails?.data?.email)
        if (adminUser.length == 0) {
            return res.status(400).json({ status: false, msg: 'Invalid authentication.' })
        }
        req.user = adminUser[0];
        next();
    } else {
        res.status(401).send('Unauthorized: Bearer token missing');
    }
});

module.exports = { authMiddleWare, adminAuthMiddleWare }