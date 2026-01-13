require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const INSTRUCTOR = {
    name: 'Instructor',
    username: 'instructor',
    email: 'dhanushsunny11@gmail.com',
    password: 'Sunny@251869',
    role: 'INSTRUCTOR'
};

const STUDENT = {
    name: 'Student',
    username: 'student',
    email: 'yashwanthkumar87657@gmail.com',
    password: 'Yash@11',
    role: 'STUDENT'
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clean up existing users with same email to avoid duplicates/conflicts
        await User.deleteMany({ email: { $in: [INSTRUCTOR.email, STUDENT.email] } });
        console.log('Cleaned up old users');

        await User.create(INSTRUCTOR);
        console.log('Instructor created');

        await User.create(STUDENT);
        console.log('Student created');

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
