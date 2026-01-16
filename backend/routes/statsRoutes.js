import express from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, instructor, getStats);

export default router;
