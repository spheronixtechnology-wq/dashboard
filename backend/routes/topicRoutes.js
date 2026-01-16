import express from 'express';
import { getTopics, createTopic } from '../controllers/topicController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getTopics).post(protect, instructor, createTopic);

export default router;
