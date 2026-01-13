const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.get('/', protect, instructor, getStats);

module.exports = router;
