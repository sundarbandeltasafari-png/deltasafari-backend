const express = require('express');
const {authMiddleWare} = require('../middleware/middleware');
const { placeOrder, verifyOrder, getAllPackage, createContact, getRecentSearchHistory, getSiteSettings, createCorporateLeadEnquiry, createHolidayEnquiry, createContactQuery, getContactQueries, toggleSavePackage, getSavedPackages, checkIsPackageSaved } = require('../controller/service/serviceController');
const { getAllPost, getCategory, getParticularPost, getPostByCategory } = require('../controller/service/postController');
const { getAllPages, getParticularPage, getFaqPage, getSearchBlogs, getParticularBlog, getAllBlogs, getTotalCategoryBlogs, getTrendingBlogs, getPageSeo } = require('../controller/service/pageController');
const { getHomeDestination, getContactDetails, getHomePosts } = require('../controller/service/commonController');
const { getHomePackages, getDestinations, getCorporateDestinations, getParticularPackage, createBookings, createPackageRazorpayOrder, verifyPackageRazorpayPayment, razorpayWebhook, getFilteredPackages, getCities, getAllCities, getAllPackageType, searchAll, getDiscountedPackages } = require('../controller/service/packageControler');
const { getAllHotelsPublic, getParticularHotelPublic } = require('../controller/admin/service/adminHotelController');
const router = express.Router();

router.route('/placeOrder').post(authMiddleWare, placeOrder);
router.route('/verifyOrder').post(authMiddleWare, verifyOrder);

router.route('/getAllPackage').get(getAllPackage);

router.route('/getRecentSearchHistory').get(authMiddleWare, getRecentSearchHistory); 
router.route('/createContact').post(createContact);

// Contact Query Routes
router.route('/createContactQuery').post(createContactQuery).get(getContactQueries);
router.route('/contact-query').post(createContactQuery).get(getContactQueries);

// Corporate Lead Enquiry Route (User)
router.route('/createCorporateLeadEnquiry').post(createCorporateLeadEnquiry);

// Holiday Enquiry Route (User 1st Endpoint)
router.route('/createHolidayEnquiry').post(createHolidayEnquiry);

// Post Route  
router.route('/getPosts').get(getAllPost);
router.route('/getCategory').get(getCategory);
router.route('/getParticularPost').get(getParticularPost);
router.route('/getPostByCategory').get(getPostByCategory);

// Common Page Route
router.route('/getPages').get(getAllPages);
router.route('/getParticularPage').get(getParticularPage);
router.route('/getFaqPage').get(getFaqPage);
router.route('/getPageSeo').get(getPageSeo);

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
router.route('/getDiscountedPackages').get(getDiscountedPackages).post(getDiscountedPackages);

// Search (Global Search Bar & Autocomplete)
router.route('/search').get(searchAll).post(searchAll);
router.route('/searchAll').get(searchAll).post(searchAll);

// Destinations
router.route('/getDestinations').get(getDestinations).post(getDestinations);
router.route('/getCorporateDestinations').get(getCorporateDestinations).post(getCorporateDestinations);

// Cities
router.route('/getCities').post(getCities);
router.route('/getAllCities').post(getAllCities);

// Bookings & Razorpay Online Payments
router.route('/createBookings').post(createBookings);
router.route('/create-razorpay-order').post(createPackageRazorpayOrder);
router.route('/createPackageRazorpayOrder').post(createPackageRazorpayOrder);
router.route('/verify-razorpay-payment').post(verifyPackageRazorpayPayment);
router.route('/verifyPackageRazorpayPayment').post(verifyPackageRazorpayPayment);
router.route('/razorpay-webhook').post(razorpayWebhook);
router.route('/webhook/razorpay').post(razorpayWebhook);

// Saved Packages / Wishlist (User & Agent)
router.route('/toggleSavePackage').post(toggleSavePackage);
router.route('/getSavedPackages').get(getSavedPackages).post(getSavedPackages);
router.route('/checkIsPackageSaved').get(checkIsPackageSaved).post(checkIsPackageSaved);

// Hotels & Reference Accommodation (Public)
router.route('/getHotels').get(getAllHotelsPublic).post(getAllHotelsPublic);
router.route('/getParticularHotel').get(getParticularHotelPublic).post(getParticularHotelPublic);

module.exports = router