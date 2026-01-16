import express from 'express';
import { generateQuestions } from '../controllers/aiController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, instructor, generateQuestions);

export default router;
