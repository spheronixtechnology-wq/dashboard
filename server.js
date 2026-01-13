
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// Initialize Gemini
// Ensure process.env.API_KEY is set in the environment where this server runs
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "dummy-key-if-missing" });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully'))
  .catch(err => console.log(`MongoDB Connection Failed: ${err.message}`));

// Health Check Endpoint
app.get('/api/health/db', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.send("connected");
  } else {
    res.send("disconnected");
  }
});

// ---------------------------------------------------------
// Schemas & Models
// ---------------------------------------------------------

// --- Embedded Schemas (The contents of a Student's "Folder") ---

const attendanceSchema = new mongoose.Schema({
  id: String,
  date: String,
  loginTime: String,
  logoutTime: String
});

const taskSubmissionSchema = new mongoose.Schema({
  id: String,
  taskId: String,
  studentName: String,
  fileUrl: String,
  submittedAt: String,
  status: { type: String, default: 'SUBMITTED' },
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' }
});

const examSubmissionSchema = new mongoose.Schema({
  id: String,
  examId: String,
  submittedAt: String,
  answers: Object, // Map of questionId -> answer
  score: Number,
  isGraded: Boolean
});

const researchSchema = new mongoose.Schema({
  id: String,
  studentName: String, // Cached for easier display
  title: String,
  abstract: String,
  fileUrl: String,
  status: { type: String, default: 'PENDING' },
  submittedAt: String,
  instructorFeedback: { type: String, default: '' }
});

// --- Main Collections ---

// 1. Student Collection (The "Student Folder")
const studentSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'STUDENT' },
  
  // Embedded Data Arrays
  attendance: [attendanceSchema],
  taskSubmissions: [taskSubmissionSchema],
  examSubmissions: [examSubmissionSchema],
  research: [researchSchema]
});

// 2. Instructor Collection (The "Instructor Folder")
const instructorSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'INSTRUCTOR' }
});

// 3. Shared Resources (Created by Instructors, consumed by Students)
const topicSchema = new mongoose.Schema({
  id: String,
  title: String,
  content: String,
  authorId: String,
  publishDate: String,
  attachments: [String],
  isPublished: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  deadline: String,
  assignedTo: mongoose.Schema.Types.Mixed,
  createdBy: String,
  type: String,
  projectCategory: String,
  isPublished: { type: Boolean, default: false }
});

const examSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  startTime: String,
  endTime: String,
  durationMinutes: Number,
  questions: Array,
  createdBy: String,
  category: String,
  status: { type: String, default: 'DRAFT' } // DRAFT, PUBLISHED
});

const Student = mongoose.model('Student', studentSchema);
const Instructor = mongoose.model('Instructor', instructorSchema);
const Topic = mongoose.model('Topic', topicSchema);
const Task = mongoose.model('Task', taskSchema);
const Exam = mongoose.model('Exam', examSchema);

// ---------------------------------------------------------
// API Routes
// ---------------------------------------------------------

// --- Auth ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Check Instructor Collection
    let user = await Instructor.findOne({ email });
    let role = 'INSTRUCTOR';

    // 2. Check Student Collection if not found
    if (!user) {
      user = await Student.findOne({ email });
      role = 'STUDENT';
      
      // If valid Student, record attendance inside their document
      if (user && user.password === password) {
        const now = new Date();
        const att = {
          id: Math.random().toString(36).substr(2, 9),
          date: now.toISOString().split('T')[0],
          loginTime: now.toISOString(),
          logoutTime: null
        };
        user.attendance.push(att);
        await user.save();
      }
    }

    if (user && user.password === password) {
      const userData = user.toObject();
      delete userData.password;
      // Return basic info without the heavy embedded arrays for the login response
      res.json({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { username, name, email, role, password } = req.body;
  try {
    const existStudent = await Student.findOne({ $or: [{ email }, { username }] });
    const existInstr = await Instructor.findOne({ $or: [{ email }, { username }] });
    
    if (existStudent || existInstr) {
      return res.status(400).json({ message: 'User or Email already exists' });
    }

    const id = Math.random().toString(36).substr(2, 9);
    let newUser;

    if (role === 'INSTRUCTOR') {
      newUser = new Instructor({ id, username, name, email, password, role });
    } else {
      newUser = new Student({ id, username, name, email, password, role });
    }

    await newUser.save();
    
    const userData = newUser.toObject();
    delete userData.password;
    res.json({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Content Resources ---

app.get('/api/topics', async (req, res) => {
  const { publishedOnly } = req.query;
  const query = publishedOnly === 'true' ? { isPublished: true } : {};
  const topics = await Topic.find(query).sort({ publishDate: -1 });
  res.json(topics);
});

app.post('/api/topics', async (req, res) => {
  const topic = new Topic({ ...req.body, id: Math.random().toString(36).substr(2, 9) });
  await topic.save();
  res.json(topic);
});

app.put('/api/topics/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const topic = await Topic.findOneAndUpdate({ id }, updates, { new: true });
  res.json(topic);
});

app.get('/api/tasks', async (req, res) => {
  const { role } = req.query;
  const query = role === 'STUDENT' ? { isPublished: true } : {};
  const tasks = await Task.find(query);
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const task = new Task({ ...req.body, id: Math.random().toString(36).substr(2, 9) });
  await task.save();
  res.json(task);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const task = await Task.findOneAndUpdate({ id }, updates, { new: true });
  res.json(task);
});

app.get('/api/exams', async (req, res) => {
  const { category, role } = req.query;
  let query = {};
  if (category) query.category = category;
  if (role === 'STUDENT') query.status = 'PUBLISHED';
  
  const exams = await Exam.find(query);
  res.json(exams);
});

app.post('/api/exams', async (req, res) => {
  const exam = new Exam({ ...req.body, id: Math.random().toString(36).substr(2, 9) });
  await exam.save();
  res.json(exam);
});

app.put('/api/exams/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  // Handle status update specifically if needed, or generic updates
  const exam = await Exam.findOneAndUpdate({ id }, updates, { new: true });
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  res.json(exam);
});

app.delete('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] Attempting to delete exam with ID: ${id}`);
    
    // 1. Delete the Exam
    // Ensure we are matching the string 'id' field, not the Mongo '_id'
    const result = await Exam.deleteOne({ id: id });
    console.log(`[DELETE] Result:`, result);
    
    if (result.deletedCount === 0) {
        console.warn(`[DELETE] Exam not found with ID: ${id}`);
        return res.status(404).json({ message: `Exam not found with ID: ${id}` });
    }

    // 2. Clean up associated submissions from Students to maintain integrity
    await Student.updateMany(
        {}, 
        { $pull: { examSubmissions: { examId: id } } }
    );
    console.log(`[DELETE] Cleaned up submissions for exam: ${id}`);

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('[DELETE] Server Error:', error);
    res.status(500).json({ message: `Failed to delete exam: ${error.message}` });
  }
});

// --- AI Generation Route ---
app.post('/api/generate-questions', async (req, res) => {
  const { topic, count, difficulty } = req.body;

  try {
    if (!process.env.API_KEY) {
      console.warn("API Key missing for AI generation.");
      return res.status(500).json({ message: "API Key missing." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} multiple choice questions about "${topic}" with difficulty level "${difficulty}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'The question text' },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4 possible answers' },
              correctAnswer: { type: Type.STRING, description: 'The correct option string, must exactly match one of the options' },
              type: { type: Type.STRING, description: 'Always set to "MCQ"' },
              maxMarks: { type: Type.NUMBER, description: 'Marks for the question, usually 10' }
            },
            required: ['text', 'options', 'correctAnswer', 'type', 'maxMarks']
          }
        }
      }
    });

    let jsonStr = response.text || "[]";
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", response.text);
      return res.status(500).json({ message: "Failed to parse AI response. Try again." });
    }

    if (!Array.isArray(questions)) questions = [questions];

    const processed = questions.map(q => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      type: 'MCQ'
    }));

    res.json(processed);
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: error.message || "Failed to generate questions via AI." });
  }
});

// --- Student Specific Data (Attendance, Submissions) ---

// Get Submissions (Handles both Student View and Instructor View)
app.get('/api/submissions', async (req, res) => {
  const { taskId, studentId } = req.query;

  // Case 1: Student viewing their own submissions
  if (studentId) {
    const student = await Student.findOne({ id: studentId });
    if (!student) return res.json([]);
    
    if (taskId) {
        const sub = student.taskSubmissions.filter(s => s.taskId === taskId);
        return res.json(sub);
    }
    return res.json(student.taskSubmissions);
  } 
  
  // Case 2: Instructor viewing submissions for a specific task
  if (taskId) {
    // Find all students who have a submission for this task
    const students = await Student.find({ 'taskSubmissions.taskId': taskId });
    let allSubs = [];
    
    students.forEach(s => {
        const sub = s.taskSubmissions.find(ts => ts.taskId === taskId);
        if (sub) {
            const subObj = sub.toObject();
            subObj.studentId = s.id; // Ensure studentId is available
            subObj.studentName = s.name; // Ensure name comes from the main record for accuracy
            allSubs.push(subObj);
        }
    });
    return res.json(allSubs);
  }

  res.json([]);
});

// Create/Update Submission
app.post('/api/submissions', async (req, res) => {
  const { taskId, studentId, studentName, fileUrl } = req.body;
  
  const student = await Student.findOne({ id: studentId });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Remove old submission for this task if exists (Re-submission logic)
  student.taskSubmissions = student.taskSubmissions.filter(s => s.taskId !== taskId);

  const newSub = {
    id: Math.random().toString(36).substr(2, 9),
    taskId,
    studentName, // We save it here, but override it on GET for consistency
    fileUrl,
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
    grade: null,
    feedback: ''
  };

  student.taskSubmissions.push(newSub);
  await student.save();
  res.json(newSub);
});

// Grade Submission
app.put('/api/submissions/:id/grade', async (req, res) => {
  const { grade, feedback } = req.body;
  const submissionId = req.params.id;

  // Find the student holding this specific submission ID
  const student = await Student.findOne({ 'taskSubmissions.id': submissionId });
  if (!student) return res.status(404).json({ message: 'Submission not found' });

  // Update the embedded document
  const subIndex = student.taskSubmissions.findIndex(s => s.id === submissionId);
  if (subIndex > -1) {
    student.taskSubmissions[subIndex].grade = grade;
    student.taskSubmissions[subIndex].feedback = feedback;
    student.taskSubmissions[subIndex].status = 'GRADED';
    await student.save();
    
    const updatedSub = student.taskSubmissions[subIndex].toObject();
    updatedSub.studentId = student.id;
    res.json(updatedSub);
  } else {
    res.status(404).json({ message: 'Submission not found' });
  }
});

// Exam Submissions
app.get('/api/exam-submissions', async (req, res) => {
  const { studentId, examId } = req.query;

  // Case 1: Instructor View (Get all submissions for an exam)
  if (examId) {
    // Find all students who have a submission for this exam
    const students = await Student.find({ 'examSubmissions.examId': examId });
    let allSubs = [];

    students.forEach(s => {
      const sub = s.examSubmissions.find(es => es.examId === examId);
      if (sub) {
        const subObj = sub.toObject();
        subObj.studentId = s.id;
        subObj.studentName = s.name; // Enrich with Student Name
        allSubs.push(subObj);
      }
    });
    return res.json(allSubs);
  }

  // Case 2: Student View (Get their own submissions)
  if (studentId) {
    const student = await Student.findOne({ id: studentId });
    if (student) {
      return res.json(student.examSubmissions);
    }
  }

  return res.json([]);
});

app.post('/api/exam-submissions', async (req, res) => {
  const { examId, studentId, answers } = req.body;
  const student = await Student.findOne({ id: studentId });
  
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const exam = await Exam.findOne({ id: examId });
  let score = 0;
  let isGraded = false;

  if (exam) {
    // Basic auto-grading
    exam.questions.forEach(q => {
      if (q.type === 'MCQ' && q.correctAnswer === answers[q.id]) {
        score += q.maxMarks;
      }
      if (q.type === 'CODING') {
         // Naive check for coding length
         const ans = answers[q.id];
         if (ans && ans.length > 20 && !ans.includes('// Write your')) {
             score += q.maxMarks;
         }
      }
    });
    // If no descriptive questions, mark graded
    const hasDescriptive = exam.questions.some(q => q.type === 'DESCRIPTIVE');
    if (!hasDescriptive) isGraded = true;
  }

  const newSub = {
    id: Math.random().toString(36).substr(2, 9),
    examId,
    submittedAt: new Date().toISOString(),
    answers,
    score,
    isGraded
  };

  student.examSubmissions.push(newSub);
  await student.save();
  res.json(newSub);
});

// Performance Aggregation
app.get('/api/student-performance/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findOne({ id: studentId });
  
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const submissions = student.examSubmissions;
  const exams = await Exam.find({}); // Get all exams to map IDs to Titles

  // Default Categories
  const categories = {
    'Coding': { total: 0, obtained: 0, color: '#10b981' },
    'Aptitude': { total: 0, obtained: 0, color: '#f59e0b' },
    'Reasoning': { total: 0, obtained: 0, color: '#3b82f6' },
    'Communication': { total: 0, obtained: 0, color: '#ef4444' }
  };

  submissions.forEach(sub => {
    const exam = exams.find(e => e.id === sub.examId);
    if (!exam) return;
    
    // Heuristic Category mapping based on title
    let categoryKey = 'Communication'; // Default
    const title = exam.title.toLowerCase();
    
    if (title.includes('code') || title.includes('js') || title.includes('python')) categoryKey = 'Coding';
    else if (title.includes('aptitude') || title.includes('math')) categoryKey = 'Aptitude';
    else if (title.includes('reason') || title.includes('logic')) categoryKey = 'Reasoning';

    const maxScore = exam.questions.reduce((a, b) => a + b.maxMarks, 0);
    categories[categoryKey].total += maxScore;
    categories[categoryKey].obtained += (sub.score || 0);
  });

  const subjectData = Object.keys(categories).map(key => {
    const cat = categories[key];
    const score = cat.total === 0 ? 0 : Math.round((cat.obtained / cat.total) * 100);
    return {
        id: key.toLowerCase(),
        label: key,
        score,
        color: cat.color
    };
  });

  const totalObtained = Object.values(categories).reduce((acc, c) => acc + c.obtained, 0);
  const grandTotal = Object.values(categories).reduce((acc, c) => acc + c.total, 0);
  const overallAvg = grandTotal === 0 ? 0 : Math.round((totalObtained / grandTotal) * 100);
  
  // Identify Weakest
  const weakest = subjectData.reduce((prev, curr) => prev.score < curr.score ? prev : curr, subjectData[0]);

  res.json({
    average: overallAvg,
    subjects: subjectData,
    weakest: { label: weakest.label, score: weakest.score }
  });
});

// Attendance
app.get('/api/attendance/:userId', async (req, res) => {
  const student = await Student.findOne({ id: req.params.userId });
  if (student) {
    const sorted = student.attendance.sort((a,b) => new Date(b.date) - new Date(a.date));
    res.json(sorted);
  } else {
    res.json([]);
  }
});

// Research
app.get('/api/research', async (req, res) => {
  const { userId } = req.query;
  
  if (userId) {
    // Student View
    const student = await Student.findOne({ id: userId });
    return res.json(student ? student.research : []);
  } else {
    // Instructor View: Aggregate all research from all students
    const students = await Student.find({ 'research.0': { $exists: true } });
    let allResearch = [];
    students.forEach(s => {
        s.research.forEach(r => {
            const rObj = r.toObject();
            rObj.studentId = s.id;
            rObj.studentName = s.name;
            allResearch.push(rObj);
        });
    });
    allResearch.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(allResearch);
  }
});

app.post('/api/research', async (req, res) => {
  const { studentId, title, abstract, fileUrl, studentName } = req.body;
  const student = await Student.findOne({ id: studentId });
  
  const newItem = {
    id: Math.random().toString(36).substr(2, 9),
    studentName,
    title,
    abstract,
    fileUrl,
    status: 'PENDING',
    submittedAt: new Date().toISOString()
  };
  
  student.research.unshift(newItem);
  await student.save();
  res.json(newItem);
});

app.put('/api/research/:id/review', async (req, res) => {
  const { status, feedback } = req.body;
  const student = await Student.findOne({ 'research.id': req.params.id });
  
  if (student) {
      const idx = student.research.findIndex(r => r.id === req.params.id);
      if (idx > -1) {
          student.research[idx].status = status;
          student.research[idx].instructorFeedback = feedback;
          await student.save();
          return res.json(student.research[idx]);
      }
  }
  res.status(404).json({ message: 'Research item not found' });
});

// Helper: Instructor Dashboard Stats
app.get('/api/stats', async (req, res) => {
    // Calculate totals across collections
    const topicCount = await Topic.countDocuments();
    const taskCount = await Task.countDocuments({ type: 'ASSIGNMENT' });
    const projectCount = await Task.countDocuments({ type: 'PROJECT' });
    
    // Count total pending submissions (Tasks & Research)
    // This is expensive in NoSQL embedded, but functional for small scale
    const students = await Student.find({});
    let pendingReviews = 0;
    
    students.forEach(s => {
        const pendingTasks = s.taskSubmissions.filter(ts => ts.status === 'SUBMITTED').length;
        const pendingResearch = s.research.filter(r => r.status === 'PENDING').length;
        pendingReviews += (pendingTasks + pendingResearch);
    });

    res.json({
        topics: topicCount,
        tasks: taskCount,
        projects: projectCount,
        submissions: pendingReviews
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
