const express = require('express');
const router = express.Router();

const { adminAuthMiddleWare } = require('../../middleware/middleware');
const { getAllCategory, createCategory, getParticularCategory, setCategory, deleteCategory } = require('../../controller/admin/service/adminCategoryController');
const { createUploader } = require('../../helper/uploadHelper');
const { getAllPost, createPost, updatePost, deletePost, getParticularPost, getPostTags } = require('../../controller/admin/service/adminPostController');
const { getAllContactList } = require('../../controller/admin/service/adminServiceController');
const { getAllZone, getParticularZone, createZone, setZone } = require('../../controller/admin/service/adminZoneController');

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

router.route('/getAllContacts').get(adminAuthMiddleWare, getAllContactList);


module.exports = router;