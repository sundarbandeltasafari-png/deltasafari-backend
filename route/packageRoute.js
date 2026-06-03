const express = require('express');
const {authMiddleWare} = require('../middleware/middleware');
const router = express.Router();

router.route('/getAllPackage').get(getAllPackage);