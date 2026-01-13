const express = require('express');
const router = express.Router();
const { getResearch, createResearch, reviewResearch, downloadResearch } = require('../controllers/researchController');
const { protect, instructor } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getResearch)
    .post(protect, upload.single('file'), createResearch);

router.route('/:id/review')
    .put(protect, instructor, reviewResearch);

router.route('/:id/download')
    .get(protect, downloadResearch);

module.exports = router;
