const express = require('express');
const router = express.Router();
const { createContactQuery, getContactQueries } = require('../controller/service/serviceController');

router.route('/').post(createContactQuery).get(getContactQueries);
router.route('/create').post(createContactQuery);

module.exports = router;
