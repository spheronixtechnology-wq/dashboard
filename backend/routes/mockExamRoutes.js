import express from 'express';
import { getMockExams, createMockExam, updateMockExam, deleteMockExam } from '../controllers/mockExamController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMockExams)
    .post(protect, instructor, createMockExam);

router.route('/:id')
    .put(protect, instructor, updateMockExam)
    .delete(protect, instructor, deleteMockExam);

export default router;
