const express = require('express');
const router = express.Router();
const { getTasks, createTask } = require('../controllers/taskController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTasks).post(protect, instructor, createTask);

module.exports = router;
