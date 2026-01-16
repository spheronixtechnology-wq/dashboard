import express from 'express';
import { getAttendance, heartbeat } from '../controllers/attendanceController.js';
import { protect, student } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/heartbeat', protect, student, heartbeat);
router.get('/:userId', protect, getAttendance);

export default router;
