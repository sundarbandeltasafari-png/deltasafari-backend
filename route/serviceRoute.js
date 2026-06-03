const express = require('express');
const {authMiddleWare} = require('../middleware/middleware');
const { placeOrder, verifyOrder, getAllPackage, createContact, getRecentSearchHistory, getAllPost, getCategory, getParticularPost, getPostByCategory, getTopTags, getBreakingPost } = require('../controller/service/serviceController');
const router = express.Router();

router.route('/placeOrder').post(authMiddleWare, placeOrder);
router.route('/verifyOrder').post(authMiddleWare, verifyOrder);

router.route('/getAllPackage').get(getAllPackage);

router.route('/getRecentSearchHistory').get(authMiddleWare, getRecentSearchHistory); 

router.route('/createContact').post(createContact);




// Service Route  
router.route('/getPosts').get(getAllPost);
router.route('/getBreakingPost').get(getBreakingPost);
router.route('/getCategory').get(getCategory);
router.route('/getParticularPost').get(getParticularPost);
router.route('/getPostByCategory').get(getPostByCategory);
router.route('/getTopTags').get(getTopTags);

module.exports = router