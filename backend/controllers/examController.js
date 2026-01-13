const Exam = require('../models/Exam');
const Result = require('../models/Result');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const { category } = req.query;
    let query = category ? { category } : {};
    
    // If Student, only show PUBLISHED exams
    if (req.user.role === 'STUDENT') {
        query.status = 'PUBLISHED';
    }

    console.log(`[GET /exams] Fetching exams for user: ${req.user.id} (${req.user.role}) with query:`, query);

    const exams = await Exam.find(query).sort({ createdAt: -1 });
    console.log(`[GET /exams] Found ${exams.length} exams`);
    
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error('[GET /exams] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an exam
// @route   POST /api/exams
// @access  Private (Instructor)
const createExam = async (req, res) => {
  try {
    console.log('[POST /exams] Creating exam with body:', req.body);
    
    const exam = await Exam.create({
        ...req.body,
        createdBy: req.user.id,
        status: 'PUBLISHED' // Default to PUBLISHED for now as per "publish" button intent
    });
    
    console.log('[POST /exams] Exam created successfully:', exam.id);
    
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('[POST /exams] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private (Instructor)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    await exam.deleteOne();
    await Result.deleteMany({ examId: req.params.id });
    
    console.log(`[DELETE /exams] Deleted exam: ${req.params.id}`);
    
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('[DELETE /exams] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private (Instructor)
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check ownership or admin (Optional, good practice)
    // if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    //   return res.status(401).json({ success: false, message: 'Not authorized' });
    // }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    console.log(`[PUT /exams] Updated exam: ${req.params.id}`, req.body);

    res.status(200).json({ success: true, data: updatedExam });
  } catch (error) {
    console.error('[PUT /exams] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExams,
  createExam,
  deleteExam,
  updateExam
};
