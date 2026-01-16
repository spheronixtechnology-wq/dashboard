import express from 'express';
import { getExams, createExam, deleteExam, updateExam, checkExamStatus, submitExam } from '../controllers/examController.js';
import { protect, instructor, student } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getExams)
    .post(protect, instructor, createExam);

router.route('/:id/status')
    .get(protect, student, checkExamStatus);

router.route('/:id')
    .put(protect, instructor, updateExam)
    .delete(protect, instructor, deleteExam);

router.route('/submit')
    .post(protect, student, submitExam);

export default router;
