import express from 'express';
import { getTasks, createTask } from '../controllers/taskController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getTasks).post(protect, instructor, createTask);

export default router;
