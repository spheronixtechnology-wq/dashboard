import express from 'express';
import { getExamSubmissions, submitExam, updateResult } from '../controllers/resultController.js';
import { protect, instructor, student } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getExamSubmissions)
    .post(protect, student, submitExam);

router.route('/:id')
    .put(protect, instructor, updateResult);

export default router;
