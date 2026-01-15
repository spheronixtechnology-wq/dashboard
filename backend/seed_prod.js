require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const INSTRUCTOR = {
    name: 'Instructor',
    username: 'instructor',
    email: 'dhanushsunny11@gmail.com',
    password: 'Sunny@111',
    role: 'INSTRUCTOR'
};

const STUDENT = {
    name: 'Student',
    username: 'student',
    email: 'yashwanthkumar87657@gmail.com',
    password: 'Yash@111',
    role: 'STUDENT'
};

const seed = async () => {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Check if users exist before creating
        const existingInstructor = await User.findOne({ email: INSTRUCTOR.email });
        if (!existingInstructor) {
            await User.create(INSTRUCTOR);
            console.log('✅ Instructor created');
        } else {
            console.log('ℹ️ Instructor already exists');
        }

        const existingStudent = await User.findOne({ email: STUDENT.email });
        if (!existingStudent) {
            await User.create(STUDENT);
            console.log('✅ Student created');
        } else {
            console.log('ℹ️ Student already exists');
        }

        console.log('✅ Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
