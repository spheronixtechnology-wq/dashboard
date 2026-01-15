const express = require('express');
const router = express.Router();
const { getExams, createExam, deleteExam, updateExam, checkExamStatus } = require('../controllers/examController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getExams)
    .post(protect, instructor, createExam);

router.route('/:id/status')
    .get(protect, checkExamStatus);

router.route('/:id')
    .put(protect, instructor, updateExam)
    .delete(protect, instructor, deleteExam);

module.exports = router;
