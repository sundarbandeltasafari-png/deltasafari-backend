const express = require('express');
const router = express.Router();

const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { getAllCategory, createCategory, getParticularCategory, setCategory, deleteCategory } = require('../../controller/admin/service/adminCategoryController');
const { getAllPost, createPost, updatePost, deletePost, getParticularPost, getPostTags } = require('../../controller/admin/service/adminPostController');
const { getAllContactList, getAllCorporateLeadEnquiries, getParticularCorporateLeadEnquiry, updateCorporateLeadEnquiry, getAdminDashboard, updateHolidayEnquiry, getParticularHolidayEnquiry, getAllHolidayEnquiries, getAllContactQueriesAdmin, getParticularContactQueryAdmin, updateContactQueryAdmin, deleteContactQueryAdmin, getAllBookings, getCombinedBookings, getParticularBooking, updateBooking, deleteBooking } = require('../../controller/admin/service/adminServiceController');
const { getAllZone, getParticularZone, createZone, setZone, deleteZone } = require('../../controller/admin/service/adminZoneController');
const { createUploader } = require('../../helper/uploadHelper');
const { getAllCity, cityStatus, getParticularCity, getSearchCity, createCity, updateCity, getAllCountries } = require('../../controller/admin/service/adminCityController');
const { getAllHotels, getParticularHotel, createHotel, updateHotel, deleteHotel, getAllHotelsDropdown } = require('../../controller/admin/service/adminHotelController');

// Post Category 
const uploadCategory = createUploader('image', 'category');
router.route('/getCategory').get(adminAuthMiddleWare, getAllCategory)
router.route('/getParticularCategory').get(adminAuthMiddleWare, getParticularCategory)
router.route('/createCategory').post(adminAuthMiddleWare, uploadCategory.single('image'), createCategory)
router.route('/setCategory').put(adminAuthMiddleWare, uploadCategory.single('image'), setCategory)
router.route('/deleteCategory').delete(adminAuthMiddleWare, deleteCategory)


// Post
const uploadPost = createUploader('both', 'posts');
router.route('/getPosts').get(adminAuthMiddleWare, getAllPost);
router.route('/createPosts').post(adminAuthMiddleWare, uploadPost.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'featured_video', maxCount: 1 }
]), createPost);
router.route('/updatePosts').put(adminAuthMiddleWare, uploadPost.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'featured_video', maxCount: 1 }
]), updatePost);
router.route('/deletePost').delete(adminAuthMiddleWare, deletePost);
router.route('/getParticularPost').get(adminAuthMiddleWare, getParticularPost);
router.route('/getPostTags').get(adminAuthMiddleWare, getPostTags);



// Zone Routes
const uploadZone = createUploader('image', 'zone');
router.route('/getZone').get(adminAuthMiddleWare, getAllZone)
router.route('/getParticularZone').post(adminAuthMiddleWare, getParticularZone)
router.route('/createZone').post(adminAuthMiddleWare, uploadZone.single('image'), createZone)
router.route('/setZone').put(adminAuthMiddleWare, uploadZone.single('image'), setZone)
router.route('/deleteZone').delete(adminAuthMiddleWare, deleteZone)

router.route('/getAllContacts').get(adminAuthMiddleWare, getAllContactList);

// Admin Dashboard Endpoint
router.route('/getDashboard').get(adminAuthMiddleWare, getAdminDashboard);

// Corporate Lead Enquiries (Admin Routes)
router.route('/getAllCorporateLeadEnquiries').get(adminAuthMiddleWare, getAllCorporateLeadEnquiries);
router.route('/getParticularCorporateLeadEnquiry').get(adminAuthMiddleWare, getParticularCorporateLeadEnquiry).post(adminAuthMiddleWare, getParticularCorporateLeadEnquiry);
router.route('/updateCorporateLeadEnquiry').put(adminAuthMiddleWare, updateCorporateLeadEnquiry).post(adminAuthMiddleWare, updateCorporateLeadEnquiry);

// Holiday Enquiries (Admin Routes)
router.route('/getAllHolidayEnquiries').get(adminAuthMiddleWare, getAllHolidayEnquiries);
router.route('/getParticularHolidayEnquiry').get(adminAuthMiddleWare, getParticularHolidayEnquiry).post(adminAuthMiddleWare, getParticularHolidayEnquiry);
router.route('/updateHolidayEnquiry').put(adminAuthMiddleWare, updateHolidayEnquiry).post(adminAuthMiddleWare, updateHolidayEnquiry);

// Contact Queries (Admin Routes)
router.route('/getAllContactQueries').get(adminAuthMiddleWare, getAllContactQueriesAdmin);
router.route('/getParticularContactQuery').get(adminAuthMiddleWare, getParticularContactQueryAdmin).post(adminAuthMiddleWare, getParticularContactQueryAdmin);
router.route('/updateContactQuery').put(adminAuthMiddleWare, updateContactQueryAdmin).post(adminAuthMiddleWare, updateContactQueryAdmin);
router.route('/deleteContactQuery').delete(adminAuthMiddleWare, deleteContactQueryAdmin);

// Bookings (Admin Routes: admin/service/getAllBookings)
router.route('/getAllBookings').get(adminAuthMiddleWare, getAllBookings).post(adminAuthMiddleWare, getAllBookings);
router.route('/getCombinedBookings').get(adminAuthMiddleWare, getCombinedBookings).post(adminAuthMiddleWare, getCombinedBookings);
router.route('/getParticularBooking').get(adminAuthMiddleWare, getParticularBooking).post(adminAuthMiddleWare, getParticularBooking);
router.route('/updateBooking').put(adminAuthMiddleWare, updateBooking).post(adminAuthMiddleWare, updateBooking);
router.route('/deleteBooking').delete(adminAuthMiddleWare, deleteBooking);


// Cities
const uploadCity = createUploader('image', 'cities');
router.route('/getCity').get(adminAuthMiddleWare, getAllCity);
router.route('/getAllCountries').get(adminAuthMiddleWare, getAllCountries);
router.route('/getParticularCity').get(adminAuthMiddleWare, getParticularCity);

router.route('/createCity').post(adminAuthMiddleWare, uploadCity.fields([
  { name: 'city_image', maxCount: 1 }
]), createCity);

router.route('/updateCity').put(adminAuthMiddleWare, uploadCity.fields([
  { name: 'city_image', maxCount: 1 }
]), updateCity);


// Hotels / Reference Hotels (Admin Routes)
const uploadHotel = createUploader('image', 'hotels');
router.route('/getHotels').get(adminAuthMiddleWare, getAllHotels);
router.route('/getAllHotelsDropdown').get(adminAuthMiddleWare, getAllHotelsDropdown);
router.route('/getParticularHotel').get(adminAuthMiddleWare, getParticularHotel).post(adminAuthMiddleWare, getParticularHotel);

router.route('/createHotel').post(adminAuthMiddleWare, uploadHotel.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images[]', maxCount: 10 }
]), createHotel);

router.route('/updateHotel').put(adminAuthMiddleWare, uploadHotel.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images[]', maxCount: 10 }
]), updateHotel).post(adminAuthMiddleWare, uploadHotel.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'images[]', maxCount: 10 }
]), updateHotel);

router.route('/deleteHotel').delete(adminAuthMiddleWare, deleteHotel).post(adminAuthMiddleWare, deleteHotel);


module.exports = router;