const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Submission = require('./models/Submission');
const Exam = require('./models/Exam');
const Result = require('./models/Result');
const Attendance = require('./models/Attendance');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        console.log('--- SEEDING PERFORMANCE DATA ---');

        // 1. Ensure Instructor
        const instructorEmail = 'dhanushsunny11@gmail.com';
        let instructor = await User.findOne({ email: instructorEmail });
        if (!instructor) {
            console.log('Creating Instructor...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Sunny@251869', salt);
            instructor = await User.create({
                name: 'Dhanush',
                email: instructorEmail,
                password: hashedPassword,
                role: 'INSTRUCTOR'
            });
        }
        console.log(`Instructor: ${instructor.id}`);

        // 2. Create/Get 10 Students
        const students = [];
        for (let i = 1; i <= 10; i++) {
            const email = `student${i}@test.com`;
            const username = `student${i}_perf`;
            let student = await User.findOne({ email });
            if (!student) {
                // Pass plain password, let User model hash it
                student = await User.create({
                    name: `Student ${i}`,
                    username,
                    email,
                    password: 'password123', 
                    role: 'STUDENT'
                });
                console.log(`Created Student ${i}`);
            } else {
                console.log(`Found Student ${i}, updating password...`);
                student.password = 'password123'; // Triggers pre-save hook
                await student.save();
            }
            students.push(student);
        }

        // 3. Create Tasks
        console.log('Creating Tasks...');
        await Task.deleteMany({ title: { $regex: /PerfTest/ } });
        const tasks = [];
        for (let i = 1; i <= 5; i++) {
            const task = await Task.create({
                title: `PerfTest Task ${i}`,
                description: 'Performance Test Task',
                assignedTo: 'ALL',
                deadline: new Date(Date.now() + 86400000 * 7),
                type: 'PROJECT',
                projectCategory: 'WEB_DEV',
                isPublished: true,
                createdBy: instructor.id
            });
            tasks.push(task);
        }

        // 4. Create Exams
        console.log('Creating Exams...');
        await Exam.deleteMany({ title: { $regex: /PerfTest/ } });
        const exams = [
            { title: 'PerfTest Coding Exam', category: 'EXAM', questions: [{ id: 'q1', maxMarks: 50 }, { id: 'q2', maxMarks: 50 }] }, // 100
            { title: 'PerfTest Aptitude Exam', category: 'EXAM', questions: [{ id: 'q1', maxMarks: 100 }] }, // 100
            { title: 'PerfTest Reasoning Exam', category: 'EXAM', questions: [{ id: 'q1', maxMarks: 100 }] }, // 100
            { title: 'PerfTest Mock Interview', category: 'MOCK', questions: [{ id: 'q1', maxMarks: 100 }] } // 100
        ];
        
        const createdExams = [];
        for (const e of exams) {
            const exam = await Exam.create({
                ...e,
                description: 'Performance Test Exam',
                durationMinutes: 60,
                status: 'PUBLISHED',
                createdBy: instructor.id
            });
            createdExams.push(exam);
        }

        // 5. Generate Data for Each Student
        console.log('Generating Student Data...');
        for (const student of students) {
            // A. Attendance (Last 30 days)
            await Attendance.deleteMany({ studentId: student.id });
            const attendanceRate = 0.7 + (Math.random() * 0.3); // 70-100%
            for (let d = 0; d < 30; d++) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                const dateStr = date.toISOString().split('T')[0];
                
                if (Math.random() < attendanceRate) {
                    await Attendance.create({
                        studentId: student.id,
                        date: dateStr,
                        status: 'PRESENT',
                        loginTime: new Date(),
                        logoutTime: new Date(),
                        totalActiveMinutes: 60 + Math.random() * 120
                    });
                } else {
                     await Attendance.create({
                        studentId: student.id,
                        date: dateStr,
                        status: 'ABSENT'
                    });
                }
            }

            // B. Task Submissions
            await Submission.deleteMany({ studentId: student.id, taskId: { $in: tasks.map(t => t.id) } });
            for (const task of tasks) {
                const grade = Math.floor(70 + Math.random() * 30); // 70-100
                await Submission.create({
                    taskId: task.id,
                    studentId: student.id,
                    studentName: student.name,
                    fileUrl: 'test.pdf',
                    status: 'GRADED',
                    grade: grade,
                    feedback: 'Good work'
                });
            }

            // C. Exam Results
            await Result.deleteMany({ studentId: student.id, examId: { $in: createdExams.map(e => e.id) } });
            for (const exam of createdExams) {
                const maxScore = exam.questions.reduce((a, b) => a + b.maxMarks, 0);
                const score = Math.floor(maxScore * (0.6 + Math.random() * 0.4)); // 60-100%
                await Result.create({
                    examId: exam.id,
                    studentId: student.id,
                    studentName: student.name,
                    answers: {},
                    score: score,
                    isGraded: true,
                    submittedAt: Date.now()
                });
            }

            // D. Coding Playground (Code Submissions)
            // Clean up old code submissions for test consistency if needed, but we used filter in seed
            // We just add 10 code submissions to hit the 100% mark (10 * 10 = 100)
            for (let k = 0; k < 10; k++) {
                await Submission.create({
                    taskId: tasks[0].id, // Dummy task link
                    studentId: student.id,
                    studentName: student.name,
                    fileUrl: 'code.js',
                    code: 'console.log("Hello")',
                    language: 'javascript',
                    status: 'SUBMITTED'
                });
            }
        }

        console.log('--- SEEDING COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
