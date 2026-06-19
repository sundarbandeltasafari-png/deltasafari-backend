const express = require('express');
const {authMiddleWare} = require('../middleware/middleware');
const { placeOrder, verifyOrder, getAllPackage, createContact, getRecentSearchHistory, getSiteSettings } = require('../controller/service/serviceController');
const { getAllPost, getCategory, getParticularPost, getPostByCategory } = require('../controller/service/postController');
const { getAllPages, getParticularPage } = require('../controller/service/pageController');
const { getHomeDestination, getContactDetails, getHomePosts } = require('../controller/service/commonController');
const router = express.Router();

router.route('/placeOrder').post(authMiddleWare, placeOrder);
router.route('/verifyOrder').post(authMiddleWare, verifyOrder);

router.route('/getAllPackage').get(getAllPackage);

router.route('/getRecentSearchHistory').get(authMiddleWare, getRecentSearchHistory); 
router.route('/createContact').post(createContact);




// Post Route  
router.route('/getPosts').get(getAllPost);
router.route('/getCategory').get(getCategory);
router.route('/getParticularPost').get(getParticularPost);
router.route('/getPostByCategory').get(getPostByCategory);

// Common Page Route
router.route('/getPages').get(getAllPages);
router.route('/getParticularPage').get(getParticularPage);

// Site Settings 
router.route('/getSiteSettings').get(getSiteSettings);


// Common Routes
router.route('/getHomeDestination').get(getHomeDestination);
router.route('/getContactDetails').get(getContactDetails);
router.route('/getHomePosts').get(getHomePosts);


module.exports = router