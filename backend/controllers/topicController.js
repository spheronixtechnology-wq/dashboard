const Topic = require('../models/Topic');

// @desc    Get all topics
// @route   GET /api/topics
// @access  Private
const getTopics = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'STUDENT') {
        query.isPublished = true;
    }

    const topics = await Topic.find(query).sort({ publishDate: -1 });
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a topic
// @route   POST /api/topics
// @access  Private (Instructor)
const createTopic = async (req, res) => {
  try {
    const topic = await Topic.create({
        ...req.body,
        authorId: req.user.id,
        isPublished: true // Default to true when created via "Publish Topic" button
    });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTopics,
  createTopic,
};
