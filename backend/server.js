const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables correctly
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: function(origin, callback){
        // Allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        // Development: Allow localhost
        if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
             return callback(null, true);
        }

        // Production: Strict Check
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
// Serve uploads statically
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: false }));

// Logging (Only in non-production)
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[API] ${req.method} ${req.url}`);
    }
    next();
});

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: "Backend is running" });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/exam-submissions', require('./routes/resultRoutes'));
app.use('/api/student-performance', require('./routes/performanceRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/research', require('./routes/researchRoutes'));
app.use('/api/generate-questions', require('./routes/aiRoutes'));
app.use('/api/mock-exams', require('./routes/mockExamRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Unhandled Rejection Handler
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err?.name, err?.message);
    process.exit(1);
});

// Start Server Logic
const startServer = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`🚀 Server started on port ${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} already in use. Stop other processes.`);
            process.exit(1);
        }
    });
};

startServer();