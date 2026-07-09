const express = require('express');
const {authMiddleWare} = require('../middleware/middleware');
const { placeOrder, verifyOrder, getAllPackage, createContact, getRecentSearchHistory, getSiteSettings } = require('../controller/service/serviceController');
const { getAllPost, getCategory, getParticularPost, getPostByCategory } = require('../controller/service/postController');
const { getAllPages, getParticularPage, getFaqPage, getSearchBlogs, getParticularBlog, getAllBlogs, getTotalCategoryBlogs, getTrendingBlogs } = require('../controller/service/pageController');
const { getHomeDestination, getContactDetails, getHomePosts } = require('../controller/service/commonController');
const { getHomePackages, getDestinations, getParticularPackage, createBookings, getFilteredPackages, getCities, getAllPackageType } = require('../controller/service/packageControler');
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
router.route('/getFaqPage').get(getFaqPage);


// Blogs
router.route('/getAllBlogs').get(getAllBlogs);
router.route('/getParticularBlog').get(getParticularBlog);
router.route('/getSearchBlog').post(getSearchBlogs);
router.route('/getTotalCategoryBlogs').get(getTotalCategoryBlogs);
router.route('/getTrendingBlogs').get(getTrendingBlogs);




// Site Settings 
router.route('/getSiteSettings').get(getSiteSettings);


// Common Routes
router.route('/getHomeDestination').get(getHomeDestination);
router.route('/getContactDetails').get(getContactDetails);
router.route('/getHomePosts').get(getHomePosts);


// Packages
router.route('/getAllPackageType').get(getAllPackageType).post(getAllPackageType);
router.route('/getHomePackages').get(getHomePackages);
router.route('/getParticularPackage').get(getParticularPackage);
router.route('/filterPackages').get(getFilteredPackages).post(getFilteredPackages);


// Destinations
router.route('/getDestinations').post(getDestinations);

// Cities
router.route('/getCities').post(getCities);

// Bookings
router.route('/createBookings').post(createBookings);


module.exports = router