const express = require('express');
const router = express.Router();
const { getAttendance, heartbeat } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/heartbeat', protect, heartbeat);
router.get('/:userId', protect, getAttendance);

module.exports = router;
