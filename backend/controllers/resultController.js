import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import Attendance from '../models/Attendance.js';
import Submission from '../models/Submission.js';

// @desc    Get exam submissions (Results)
// @route   GET /api/exam-submissions
// @access  Private
const getExamSubmissions = async (req, res) => {
  try {
    const { studentId, examId } = req.query;
    let query = {};

    if (examId) query.examId = examId;
    if (studentId) query.studentId = studentId;

    // Security: Student can only see own
    if (req.user.role === 'STUDENT') {
        query.studentId = req.user.id;
    }

    const results = await Result.find(query).sort({ submittedAt: -1 });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit exam
// @route   POST /api/exam-submissions
// @access  Private (Student)
const submitExam = async (req, res) => {
  try {
    console.log("[POST /exam-submissions] Payload:", req.body); // Debug Log

    const { examId, answers = {} } = req.body; // Default answers to empty object
    const studentId = req.user.id;

    if (!examId) {
        return res.status(400).json({ success: false, message: 'Exam ID is required' });
    }

    // Check if already submitted
    const existingResult = await Result.findOne({ examId, studentId });
    if (existingResult) {
        return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const exam = await Exam.findById(examId).select('questions'); // Only fetch questions
    
    if (!exam) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let score = 0;
    let isGraded = false;

    // Optimized auto-grading (Restored)
    if (exam.questions && Array.isArray(exam.questions)) {
        exam.questions.forEach(q => {
            const studentAns = answers[q.id];
            
            // Log for debugging
            console.log(`[Grading] QID: ${q.id} | Type: ${q.type} | Correct: '${q.correctAnswer}' | Student: '${studentAns}' | MaxMarks: ${q.maxMarks}`);

            if (q.type === 'MCQ') {
                const correct = q.correctAnswer ? String(q.correctAnswer).trim() : '';
                const student = studentAns ? String(studentAns).trim() : '';
                
                if (correct === student) {
                    score += (q.maxMarks || 1); // Default to 1 mark if undefined
                }
            }
            
            // Basic heuristic for coding
            if (q.type === 'CODING' && studentAns && typeof studentAns === 'string') {
                if (studentAns.length > 20 && !studentAns.includes('// Write your')) {
                    score += (q.maxMarks || 1);
                }
            }
        });
        
        const hasDescriptive = exam.questions.some(q => q.type === 'DESCRIPTIVE');
        if (!hasDescriptive) isGraded = true;
    }

    const result = await Result.create({
        examId,
        studentId,
        studentName: req.user.name,
        answers,
        score,
        isGraded,
        submittedAt: Date.now()
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Submit Exam Error:", error);
    // Handle Duplicate Key Error specifically (Race condition)
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Exam already submitted (Duplicate)' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student performance stats
// @route   GET /api/student-performance/:studentId
// @access  Private
const getStudentPerformance = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (req.user?.role) {
            const role = req.user.role.trim().toUpperCase();
            if (role === 'STUDENT' && String(studentId) !== String(req.user.id)) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }
            if (role !== 'STUDENT' && role !== 'INSTRUCTOR' && role !== 'ADMIN') {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }
        }
        
        // --- 1. Exams (30%) ---
        const examResults = await Result.find({ studentId });
        const examIds = [...new Set(examResults.map(r => r.examId).filter(Boolean))];
        const exams = examIds.length > 0 ? await Exam.find({ _id: { $in: examIds } }) : [];
        const examsById = new Map(exams.map(e => [e._id.toString(), e]));
        
        const examCategories = {
            'Coding': { total: 0, obtained: 0, color: '#10b981' },
            'Aptitude': { total: 0, obtained: 0, color: '#f59e0b' },
            'Reasoning': { total: 0, obtained: 0, color: '#3b82f6' },
            'Communication': { total: 0, obtained: 0, color: '#ef4444' }
        };

        examResults.forEach(sub => {
            const exam = examsById.get(sub.examId.toString());
            if (!exam) return;

            // Skip Mock Exams for Subject Breakdown (handled separately)
            if (exam.category === 'MOCK') return;

            let categoryKey = 'Communication';
            const title = exam.title.toLowerCase();

            if (title.includes('code') || title.includes('coding') || title.includes('js') || title.includes('python')) categoryKey = 'Coding';
            else if (title.includes('aptitude') || title.includes('math')) categoryKey = 'Aptitude';
            else if (title.includes('reason') || title.includes('logic')) categoryKey = 'Reasoning';

            // console.log(`Exam: "${title}" -> Category: ${categoryKey}`);

            const maxScore = exam.questions.reduce((a, b) => a + (b.maxMarks || 0), 0);
            examCategories[categoryKey].total += maxScore;
            examCategories[categoryKey].obtained += (sub.score || 0);
        });

        const subjectData = Object.keys(examCategories).map(key => {
            const cat = examCategories[key];
            const score = cat.total === 0 ? 0 : Math.round((cat.obtained / cat.total) * 100);
            return {
                id: key.toLowerCase(),
                label: key,
                score,
                color: cat.color
            };
        });

        const totalObtainedExams = Object.values(examCategories).reduce((acc, c) => acc + c.obtained, 0);
        const grandTotalExams = Object.values(examCategories).reduce((acc, c) => acc + c.total, 0);
        const examScore = grandTotalExams === 0 ? 0 : Math.round((totalObtainedExams / grandTotalExams) * 100);


        // --- 2. Attendance (20%) ---
        const attendanceRecords = await Attendance.find({ studentId });
        const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
        const totalDays = attendanceRecords.length || 1; // Avoid divide by zero
        const attendanceScore = Math.min(Math.round((presentDays / totalDays) * 100), 100);


        // --- 3. Tasks & Assignments (20%) ---
        const taskSubmissions = await Submission.find({ studentId, code: { $exists: false } }); // Exclude code submissions if tracked separately
        // For simplicity, we assume if graded, we use grade. If just submitted, 100%.
        // Better: count total assigned tasks vs completed.
        // Simplified for now: Average of graded tasks
        let taskTotal = 0;
        let taskCount = 0;
        taskSubmissions.forEach(s => {
             if (s.grade !== null) {
                 taskTotal += s.grade; // Assuming grade is out of 100? Or normalized? 
                 // If grade is not 0-100, we might need normalization. 
                 // Let's assume standard 100 scale for tasks.
                 taskCount++;
             }
        });
        const taskScore = taskCount === 0 ? 0 : Math.round(taskTotal / taskCount);


        // --- 4. Coding Playground (15%) ---
        // Just checking number of coding submissions for now, or use specific coding tasks
        const codingSubmissions = await Submission.find({ studentId, code: { $exists: true } });
        const codingScore = Math.min(codingSubmissions.length * 10, 100); // 10 points per submission, max 100


        // --- 5. Mock Interview (15%) ---
        // We don't have a Mock Interview model yet. 
        // Placeholder or reuse Result with specific category 'MOCK_INTERVIEW'?
        // For now, let's assume Mock Interview is an Exam with category 'MOCK'.
        const mockResults = examResults.filter(r => {
             const exam = examsById.get(r.examId.toString());
             return exam && exam.category === 'MOCK';
        });
        
        let mockTotal = 0;
        let mockMax = 0;
        mockResults.forEach(r => {
             const exam = examsById.get(r.examId.toString());
             if(exam) {
                 mockTotal += r.score || 0;
                 mockMax += exam.questions.reduce((a, b) => a + (b.maxMarks || 0), 0);
             }
        });
        const mockScore = mockMax === 0 ? 0 : Math.round((mockTotal / mockMax) * 100);


        // --- Weighted Calculation ---
        // Attendance: 20%
        // Exams: 30%
        // Tasks: 20%
        // Coding: 15%
        // Mock Interview: 15%
        
        const overallPerformance = Math.round(
            (attendanceScore * 0.20) +
            (examScore * 0.30) +
            (taskScore * 0.20) +
            (codingScore * 0.15) +
            (mockScore * 0.15)
        );

        const weakest = subjectData.reduce((prev, curr) => prev.score < curr.score ? prev : curr, subjectData[0] || { label: 'None', score: 0 });

        res.json({
            success: true,
            data: {
                average: overallPerformance,
                breakdown: {
                    attendance: attendanceScore,
                    exams: examScore,
                    tasks: taskScore,
                    coding: codingScore,
                    mock: mockScore
                },
                subjects: subjectData,
                weakest: { label: weakest.label, score: weakest.score }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Update exam result (Instructor override)
// @route   PUT /api/exam-submissions/:id
// @access  Private (Instructor)
const updateResult = async (req, res) => {
  try {
    const { score, isGraded } = req.body;
    const result = await Result.findById(req.params.id);

    if (!result) {
        return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (score !== undefined) result.score = score;
    if (isGraded !== undefined) result.isGraded = isGraded;

    await result.save();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getExamSubmissions,
  submitExam,
  getStudentPerformance,
  updateResult
};
