const express = require('express');
const router = express.Router();
const { getMockExams, createMockExam, updateMockExam, deleteMockExam } = require('../controllers/mockExamController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getMockExams)
    .post(protect, instructor, createMockExam);

router.route('/:id')
    .put(protect, instructor, updateMockExam)
    .delete(protect, instructor, deleteMockExam);

module.exports = router;
