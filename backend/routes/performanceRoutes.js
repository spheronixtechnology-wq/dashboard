import express from 'express';
import { getStudentPerformance } from '../controllers/resultController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:studentId', protect, getStudentPerformance);

export default router;
