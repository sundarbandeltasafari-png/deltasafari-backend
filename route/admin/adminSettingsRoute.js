const express = require('express');
const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { createUploader } = require('../../helper/uploadHelper');
const { getParticularSiteSettings, setSiteSettings } = require('../../controller/admin/settings/adminSiteSettingsController');
const { getAllPages, getFaqPage, setFaqPageSettings, getSeoPage, setSeoPageSettings, getAllOfficeAddress, setContactChanel, createOfficeAddress, deleteOfficeAddress } = require('../../controller/admin/settings/adminPageSettingsController');
const router = express.Router();


const uploadSiteSettings = createUploader('image', 'siteSettings');
router.route('/getParticularSiteSettings').get(adminAuthMiddleWare, getParticularSiteSettings);
router.route('/editSiteSettings').put(adminAuthMiddleWare, uploadSiteSettings.fields([
    { name: 'site_logo', maxCount: 1 },
    { name: 'site_favicon', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
    { name: 'twitter_image', maxCount: 1 }
]), setSiteSettings);

router.route('/getAllPages').post(adminAuthMiddleWare, getAllPages);

const uploadPageSettings = createUploader('image', 'siteSettings');
router.route('/editSiteSettings').put(adminAuthMiddleWare, uploadSiteSettings.fields([
    { name: 'site_logo', maxCount: 1 },
    { name: 'site_favicon', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
    { name: 'twitter_image', maxCount: 1 }
]), setSiteSettings);

router.route('/getFaqPage').post(adminAuthMiddleWare, getFaqPage);
router.route('/setFaqPageSettings').put(adminAuthMiddleWare, uploadSiteSettings.fields([
    { name: 'image', maxCount: 1 }
]), setFaqPageSettings);

router.route('/getSeoPage').post(adminAuthMiddleWare, getSeoPage);
router.route('/setSeoPageSettings').put(adminAuthMiddleWare, uploadSiteSettings.fields([
    { name: 'image', maxCount: 1 }
]), setSeoPageSettings);

router.route('/getAllOfficeAddress').get(adminAuthMiddleWare, getAllOfficeAddress);
router.route('/createOfficeAddress').post(adminAuthMiddleWare, createOfficeAddress);
router.route('/deleteOfficeAddress').delete(adminAuthMiddleWare, deleteOfficeAddress);

router.route('/setContactChanel').post(adminAuthMiddleWare, setContactChanel);

module.exports = router;