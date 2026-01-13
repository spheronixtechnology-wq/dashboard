const express = require('express');
const router = express.Router();
const { getSubmissions, createSubmission, gradeSubmission, downloadSubmission } = require('../controllers/submissionController');
const { protect, instructor } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getSubmissions)
    .post(protect, upload.single('file'), createSubmission);

router.route('/:id/grade')
    .put(protect, instructor, gradeSubmission);

router.route('/:id/download')
    .get(protect, instructor, downloadSubmission);

module.exports = router;
