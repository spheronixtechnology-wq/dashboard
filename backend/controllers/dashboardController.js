import Topic from '../models/Topic.js';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import Research from '../models/Research.js';

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

export { getStats };
