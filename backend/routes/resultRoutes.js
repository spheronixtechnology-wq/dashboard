const express = require('express');
const router = express.Router();
const { getExamSubmissions, submitExam, updateResult } = require('../controllers/resultController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getExamSubmissions)
    .post(protect, submitExam);

router.route('/:id')
    .put(protect, instructor, updateResult);

module.exports = router;
