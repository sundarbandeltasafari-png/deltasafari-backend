const express = require('express');
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { getAllPackageType, createPackage, getAllPackages, getParticularPackage, editPackage, deletePackage } = require('../../controller/admin/package/adminPackageController');
const { createUploader } = require('../../helper/uploadHelper');
const validateSchema = require('../../middleware/validateSchema');
const { tourValidationSchema } = require('../../schema/packageSchema');
const router = express.Router();

// Package Types
const uploadPost = createUploader('both', 'packages');
router.route('/getAllPackageType').get(adminAuthMiddleWare, getAllPackageType)
router.route('/createPackage').post(adminAuthMiddleWare, validateSchema(tourValidationSchema), uploadPost.fields([
    { name: 'images[]', maxCount: 15 },
    { name: 'videos[]', maxCount: 5 }
]), createPackage)
router.route('/getAllPackages').get(adminAuthMiddleWare, getAllPackages);
router.route('/getParticularPackage').get(adminAuthMiddleWare, getParticularPackage);
router.route('/editParticularPackage').post(adminAuthMiddleWare, validateSchema(tourValidationSchema), uploadPost.fields([
    { name: 'images[]', maxCount: 15 },
    { name: 'videos[]', maxCount: 5 }
]), editPackage);
router.route('/deletePackage').delete(adminAuthMiddleWare, deletePackage);

module.exports = router;