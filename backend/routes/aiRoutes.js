const express = require('express');
const router = express.Router();
const { generateQuestions } = require('../controllers/aiController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.post('/', protect, instructor, generateQuestions);

module.exports = router;
