import Exam from '../models/Exam.js';
import Result from '../models/Result.js';

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

    const examQuestions = Array.isArray(exam.questions) ? exam.questions : [];
    const hasDescriptive = examQuestions.some((q) => String(q?.type || '').toUpperCase() === 'DESCRIPTIVE');
    const isGraded = !hasDescriptive;

    const answersMap = (() => {
      if (answers && typeof answers === 'object' && !Array.isArray(answers)) return answers;
      if (Array.isArray(answers)) {
        const map = {};
        examQuestions.forEach((q, idx) => {
          const key = q?.id ?? String(idx);
          map[key] = answers[idx];
        });
        return map;
      }
      return {};
    })();

    let score = 0;
    for (const q of examQuestions) {
      const qType = String(q?.type || '').toUpperCase();
      const qId = q?.id;
      const studentAns = qId !== undefined ? answersMap[qId] : undefined;
      const maxMarks = Number(q?.maxMarks ?? q?.marks ?? 1) || 1;

      if (qType === 'MCQ') {
        const correct = q?.correctAnswer ? String(q.correctAnswer).trim() : '';
        const student = studentAns ? String(studentAns).trim() : '';
        if (correct && student && correct === student) score += maxMarks;
      }

      if (qType === 'CODING' && typeof studentAns === 'string') {
        if (studentAns.length > 20 && !studentAns.includes('// Write your')) score += maxMarks;
      }
    }

    // 4. Create the Result
    const result = await Result.create({
      examId,
      studentId,
      studentName: req.user.name,
      answers: answersMap,
      score,
      isGraded,
      submittedAt: Date.now()
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[POST /exams/submit] Error:', error);
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: 'Exam already submitted (Duplicate)' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getExams,
  createExam,
  deleteExam,
  updateExam,
  submitExam,
  checkExamStatus
};
