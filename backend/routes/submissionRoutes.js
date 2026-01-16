import express from 'express';
import { getSubmissions, createSubmission, gradeSubmission, downloadSubmission } from '../controllers/submissionController.js';
import { protect, instructor, student } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getSubmissions)
    .post(protect, student, upload.single('file'), createSubmission);

router.route('/:id/grade')
    .put(protect, instructor, gradeSubmission);

router.route('/:id/download')
    .get(protect, instructor, downloadSubmission);

export default router;
