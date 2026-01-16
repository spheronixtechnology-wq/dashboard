import Task from '../models/Task.js';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'STUDENT') {
        query.isPublished = true;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private (Instructor)
const createTask = async (req, res) => {
  try {
    const task = await Task.create({
        ...req.body,
        createdBy: req.user.id,
        isPublished: true // Default to true
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getTasks,
  createTask,
};
