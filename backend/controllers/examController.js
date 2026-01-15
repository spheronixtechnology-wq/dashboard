const Exam = require('../models/Exam');
const Result = require('../models/Result');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const { category } = req.query;
    let query = category ? { category } : {};
    
    if (req.user.role === 'STUDENT') {
        query.status = 'PUBLISHED';
    }

    // 1. Fetch the exams
    const exams = await Exam.find(query).sort({ createdAt: -1 });

    // 2. If it's a student, find which exams they have already submitted
    if (req.user.role === 'STUDENT') {
        const studentResults = await Result.find({ studentId: req.user.id });

        // Attach an 'isSubmitted' flag and score to each exam object
        const examsWithStatus = exams.map(exam => {
            const examObj = exam.toObject();
            const result = studentResults.find(r => r.examId.toString() === exam._id.toString());
            
            examObj.hasSubmitted = !!result; // Changed from isSubmitted to hasSubmitted
            if (result) {
                examObj.score = result.score;
            }
            return examObj;
        });

        return res.status(200).json({ success: true, data: examsWithStatus });
    }
    
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error('[GET /exams] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if student has submitted an exam
// @route   GET /api/exams/:id/status
// @access  Private (Student)
const checkExamStatus = async (req, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user.id;

    const result = await Result.findOne({ examId, studentId });
    
    res.status(200).json({ 
        success: true, 
        hasSubmitted: !!result 
    });
  } catch (error) {
    console.error('[GET /exams/:id/status] Error:', error);
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

// @desc    Submit exam answers
// @route   POST /api/exams/submit
// @access  Private (Student)
const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    // 1. Check if already submitted
    const existingResult = await Result.findOne({ examId, studentId });
    if (existingResult) {
      return res.status(400).json({ 
        success: false, 
        message: 'Exam already submitted' 
      });
    }

    // 2. Fetch the exam to calculate score
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // 3. Simple Scoring Logic (Adjust based on your question structure)
    let score = 0;
    exam.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score += question.marks || 1;
      }
    });

    // 4. Create the Result
    const result = await Result.create({
      examId,
      studentId,
      answers,
      score,
      totalMarks: exam.totalMarks,
      status: 'COMPLETED',
      submittedAt: Date.now()
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[POST /exams/submit] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExams,
  createExam,
  deleteExam,
  updateExam,
  submitExam,
  checkExamStatus
};