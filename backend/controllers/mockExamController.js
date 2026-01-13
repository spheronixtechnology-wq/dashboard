const MockExam = require('../models/MockExam');

// @desc    Get all mock exams
// @route   GET /api/mock-exams
// @access  Private
const getMockExams = async (req, res) => {
  try {
    const { studentId } = req.query;
    let query = {};
    if (studentId) query.studentId = studentId;

    if (req.user.role === 'STUDENT') {
        query.studentId = req.user.id;
    }

    const mockExams = await MockExam.find(query).sort({ date: -1 }).populate('studentId', 'name email');
    res.status(200).json({ success: true, data: mockExams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create mock exam entry
// @route   POST /api/mock-exams
// @access  Private (Instructor)
const createMockExam = async (req, res) => {
  try {
    const { studentId, title, score, totalMarks, feedback, date } = req.body;

    const mockExam = await MockExam.create({
        studentId,
        title,
        score,
        totalMarks,
        feedback,
        date: date || Date.now(),
        createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: mockExam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update mock exam
// @route   PUT /api/mock-exams/:id
// @access  Private (Instructor)
const updateMockExam = async (req, res) => {
  try {
    const mockExam = await MockExam.findById(req.params.id);

    if (!mockExam) {
        return res.status(404).json({ success: false, message: 'Mock exam not found' });
    }

    const updatedMockExam = await MockExam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedMockExam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete mock exam
// @route   DELETE /api/mock-exams/:id
// @access  Private (Instructor)
const deleteMockExam = async (req, res) => {
  try {
    const mockExam = await MockExam.findById(req.params.id);

    if (!mockExam) {
        return res.status(404).json({ success: false, message: 'Mock exam not found' });
    }

    await mockExam.deleteOne();
    res.status(200).json({ success: true, message: 'Mock exam removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMockExams,
  createMockExam,
  updateMockExam,
  deleteMockExam
};
