import express from 'express';
import { getResearch, createResearch, reviewResearch, downloadResearch } from '../controllers/researchController.js';
import { protect, instructor, student } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getResearch)
    .post(protect, student, upload.single('file'), createResearch);

router.route('/:id/review')
    .put(protect, instructor, reviewResearch);

router.route('/:id/download')
    .get(protect, downloadResearch);

export default router;
