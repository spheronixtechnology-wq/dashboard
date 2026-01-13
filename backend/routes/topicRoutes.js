const express = require('express');
const router = express.Router();
const { getTopics, createTopic } = require('../controllers/topicController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTopics).post(protect, instructor, createTopic);

module.exports = router;
