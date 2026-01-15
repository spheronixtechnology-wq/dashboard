const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const PendingUser = require('./models/PendingUser');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api/auth';
const OTP_FILE = path.join(__dirname, 'otp.tmp');

// Helper to make fetch requests
const request = async (endpoint, method = 'GET', body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    
    return {
        status: res.status,
        data: await res.json()
    };
};

const readOTP = () => {
    // Wait for up to 3 seconds for the file to appear
    const start = Date.now();
    while (Date.now() - start < 3000) {
        if (fs.existsSync(OTP_FILE)) {
            const otp = fs.readFileSync(OTP_FILE, 'utf8').trim();
            fs.unlinkSync(OTP_FILE); // Consume OTP
            return otp;
        }
    }
    return null;
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
    try {
        console.log("🚀 Starting Automated Verification Suite...\n");

        // 1. SETUP
        console.log("------------------------------------------");
        console.log("1️⃣  SETUP & RESET");
        await mongoose.connect(process.env.MONGO_URI);
        await User.deleteMany({ email: { $in: ['yashwanthkumar87657@gmail.com', 'dhanushsunny11@gmail.com', '212g5a0237@gmail.com'] } });
        await PendingUser.deleteMany({ email: { $in: ['yashwanthkumar87657@gmail.com', 'dhanushsunny11@gmail.com', '212g5a0237@gmail.com'] } });
        
        // Seed initial users manually to match "Initial Credentials"
        await User.create({
            name: "Yashwanth",
            username: "yashwanth",
            email: "yashwanthkumar87657@gmail.com",
            password: "Yashwanth@048",
            role: "STUDENT"
        });
        await User.create({
            name: "Instructor",
            username: "instructor",
            email: "dhanushsunny11@gmail.com",
            password: "Sunny@251869",
            role: "INSTRUCTOR"
        });
        console.log("✅ Database reset and seeded with initial users.");

        // 2. PASSWORD RESET FLOW
        console.log("\n------------------------------------------");
        console.log("2️⃣  PASSWORD RESET FLOW");

        // 2.1 Student Reset
        console.log("\n[Student] Requesting Password Reset...");
        await request('/forgot-password', 'POST', { email: 'yashwanthkumar87657@gmail.com' });
        await wait(1000); // Wait for file write
        const studentOTP = readOTP();
        if (!studentOTP) throw new Error("OTP not found for Student!");
        console.log(`✅ OTP Received: ${studentOTP}`);

        console.log("[Student] Verifying OTP...");
        const v1 = await request('/verify-reset-code', 'POST', { email: 'yashwanthkumar87657@gmail.com', code: studentOTP });
        if (!v1.data.success) throw new Error("OTP Verification Failed");

        console.log("[Student] Setting new password: yash123");
        const r1 = await request('/reset-password', 'POST', { email: 'yashwanthkumar87657@gmail.com', code: studentOTP, newPassword: 'yash123' });
        if (!r1.data.success) throw new Error("Password Reset Failed");
        console.log("✅ Student Password Reset Success");

        // 2.2 Instructor Reset
        console.log("\n[Instructor] Requesting Password Reset...");
        await request('/forgot-password', 'POST', { email: 'dhanushsunny11@gmail.com' });
        await wait(1000);
        const instOTP = readOTP();
        if (!instOTP) throw new Error("OTP not found for Instructor!");
        console.log(`✅ OTP Received: ${instOTP}`);

        console.log("[Instructor] Setting new password: Sunny123");
        const r2 = await request('/reset-password', 'POST', { email: 'dhanushsunny11@gmail.com', code: instOTP, newPassword: 'Sunny123' });
        if (!r2.data.success) throw new Error("Password Reset Failed");
        console.log("✅ Instructor Password Reset Success");

        // 3. LOGIN VERIFICATION
        console.log("\n------------------------------------------");
        console.log("3️⃣  LOGIN VERIFICATION");

        console.log("[Student] Logging in with new password (yash123)...");
        const l1 = await request('/login', 'POST', { email: 'yashwanthkumar87657@gmail.com', password: 'yash123' });
        if (!l1.data.success) throw new Error("Student Login Failed");
        const studentToken = l1.data.data.token;
        console.log("✅ Student Login Success");

        console.log("[Instructor] Logging in with new password (Sunny123)...");
        const l2 = await request('/login', 'POST', { email: 'dhanushsunny11@gmail.com', password: 'Sunny123' });
        if (!l2.data.success) throw new Error("Instructor Login Failed");
        const instructorToken = l2.data.data.token;
        console.log("✅ Instructor Login Success");

        // 4. PASSWORD CHANGE (INSIDE DASHBOARD)
        console.log("\n------------------------------------------");
        console.log("4️⃣  PASSWORD CHANGE (INSIDE DASHBOARD)");

        console.log("[Student] Changing password to Yash@456...");
        const c1 = await request('/change-password', 'PUT', { currentPassword: 'yash123', newPassword: 'Yash@456' }, studentToken);
        if (!c1.data.success) throw new Error(`Student Change Password Failed: ${c1.data.message}`);
        
        console.log("[Student] Verifying new password login...");
        const l3 = await request('/login', 'POST', { email: 'yashwanthkumar87657@gmail.com', password: 'Yash@456' });
        if (!l3.data.success) throw new Error("Student Login with NEW password Failed");
        console.log("✅ Student Password Change Verified");

        console.log("[Instructor] Changing password to Sunny@456...");
        const c2 = await request('/change-password', 'PUT', { currentPassword: 'Sunny123', newPassword: 'Sunny@456' }, instructorToken);
        if (!c2.data.success) throw new Error(`Instructor Change Password Failed: ${c2.data.message}`);

        console.log("[Instructor] Verifying new password login...");
        const l4 = await request('/login', 'POST', { email: 'dhanushsunny11@gmail.com', password: 'Sunny@456' });
        if (!l4.data.success) throw new Error("Instructor Login with NEW password Failed");
        console.log("✅ Instructor Password Change Verified");

        // 5. STUDENT CREATION FLOW (Signup)
        console.log("\n------------------------------------------");
        console.log("5️⃣  STUDENT CREATION FLOW");

        console.log("Creating Student 2 (212g5a0237@gmail.com)...");
        const s1 = await request('/signup', 'POST', { 
            name: "New Student", 
            username: "newstudent", 
            email: "212g5a0237@gmail.com", 
            password: "Student@123", 
            role: "STUDENT" 
        });

        if (s1.status !== 200) throw new Error(`Signup Failed: ${s1.data.message}`);
        // await wait(1000);
        const signupOTP = await readOTP();
        console.log(`✅ Signup OTP Received: ${signupOTP}`);

        console.log("Verifying Signup OTP...");
        const v2 = await request('/verify-signup', 'POST', { email: "212g5a0237@gmail.com", code: signupOTP });
        if (!v2.data.success) throw new Error("Signup Verification Failed");
        console.log("✅ Student 2 Created and Verified");

        console.log("\n==========================================");
        console.log("🎉 ALL TESTS PASSED SUCCESSFULLY");
        console.log("==========================================");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        process.exit(1);
    }
};

runTests();
