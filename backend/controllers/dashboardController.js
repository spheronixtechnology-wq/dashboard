const Topic = require('../models/Topic');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Research = require('../models/Research');

// @desc    Get dashboard stats
// @route   GET /api/stats
// @access  Private (Instructor)
const getStats = async (req, res) => {
  try {
    const topicCount = await Topic.countDocuments();
    const taskCount = await Task.countDocuments({ type: 'ASSIGNMENT' });
    const projectCount = await Task.countDocuments({ type: 'PROJECT' });
    
    const pendingTasks = await Submission.countDocuments({ status: 'SUBMITTED' });
    const pendingResearch = await Research.countDocuments({ status: 'PENDING' });
    
    res.status(200).json({
      success: true,
      data: {
        topics: topicCount,
        tasks: taskCount,
        projects: projectCount,
        submissions: pendingTasks + pendingResearch,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };
