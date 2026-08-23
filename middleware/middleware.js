const asyncHandler = require('express-async-handler');
const { validateToken } = require('./jwtMiddleware');
const { getParticularUser, getParticularUserById } = require('../model/admin/adminAuthModel');
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
        const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader;
        const userDetails = validateToken(token);
        if (!userDetails.status) {
            return res.status(401).json({ status: false, msg: 'Invalid or expired authentication token.' });
        }
        let adminUser = [];
        if (userDetails?.data?.email || userDetails?.data?.phone) {
            adminUser = await getParticularUser(userDetails?.data?.email || userDetails?.data?.phone);
        } else if (userDetails?.data?.id) {
            adminUser = await getParticularUserById(userDetails?.data?.id);
        }
        if (adminUser.length === 0) {
            return res.status(401).json({ status: false, msg: 'Administrator account not found or access denied.' });
        }
        req.user = adminUser[0];
        next();
    } else {
        res.status(401).json({ status: false, msg: 'Unauthorized: Bearer token missing.' });
    }
});

const superAdminAuthMiddleWare = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : authHeader;
        const userDetails = validateToken(token);
        if (!userDetails.status) {
            return res.status(401).json({ status: false, msg: 'Invalid or expired authentication token.' });
        }
        let adminUser = [];
        if (userDetails?.data?.email || userDetails?.data?.phone) {
            adminUser = await getParticularUser(userDetails?.data?.email || userDetails?.data?.phone);
        } else if (userDetails?.data?.id) {
            adminUser = await getParticularUserById(userDetails?.data?.id);
        }
        if (adminUser.length === 0) {
            return res.status(401).json({ status: false, msg: 'Administrator account not found or access denied.' });
        }
        req.user = adminUser[0];
        if (req.user?.admin !== 1) {
            return res.status(403).json({ status: false, msg: 'Access denied: Super Admin privilege required.' });
        }
        next();
    } else {
        res.status(401).json({ status: false, msg: 'Unauthorized: Bearer token missing.' });
    }
});

module.exports = { authMiddleWare, adminAuthMiddleWare, superAdminAuthMiddleWare }