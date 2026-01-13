const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const PendingUser = require('../models/PendingUser');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  let { name, username, email, password, role } = req.body;

  // Normalize inputs
  if (email) email = email.toLowerCase().trim();
  if (username) username = username.toLowerCase().trim();

  if (!name || !email || !password || !username) {
    return res.status(400).json({ success: false, message: 'Please add all fields' });
  }

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Generate OTP for Email Verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store in PendingUser
  await PendingUser.findOneAndUpdate(
    { email }, // Find by email
    { name, username, email, password, role: role || 'STUDENT', otp, otpExpiry }, // Update or Insert
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send Verification Email
  const message = `
Hello ${name},

Thank you for signing up with Spheronix Technology.

Please verify your email address to complete your registration.
Your verification code is:

━━━━━━━━━━━━━━━━
   ${otp}
━━━━━━━━━━━━━━━━

This code is valid for 10 minutes.

Regards, 
Spheronix Technology 
  `;

  try {
      await sendEmail({
          email: email,
          subject: 'Verify your Spheronix Account',
          message: message,
      });
      
      console.log(`[AUTH] Verification OTP sent to ${email}`);

      res.status(200).json({ 
          success: true, 
          message: 'Verification code sent to email',
          requiresVerification: true,
          email: email 
      });
  } catch (error) {
      console.error("Email send error:", error);
      return res.status(500).json({ success: false, message: 'Could not send verification email. Please try again.' });
  }
};

// @desc    Verify Signup OTP and Create Account
// @route   POST /api/auth/verify-signup
// @access  Public
const verifySignup = async (req, res) => {
    const { email, code } = req.body;

    try {
        const pendingUser = await PendingUser.findOne({ 
            email, 
            otp: code, 
            otpExpiry: { $gt: Date.now() } 
        });

        if (!pendingUser) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        // Create actual user
        const user = await User.create({
            name: pendingUser.name,
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password, // Password is plain text in pending, will be hashed by User model hook
            role: pendingUser.role,
        });

        // Delete pending record
        await PendingUser.deleteOne({ _id: pendingUser._id });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'Email verified successfully. Account created.',
                data: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    token: generateToken(user._id),
                },
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  let { email, password, role } = req.body;

  // Normalize email
  if (email) email = email.toLowerCase().trim();

  // Check for user email
    const user = await User.findOne({ email });

    if (user) {
        // Check password
        const isMatch = await user.matchPassword(password);

        if (isMatch) {
        // Strict Role Check (Case Insensitive)
        if (role && user.role.toUpperCase() !== role.toUpperCase()) {
            return res.status(401).json({ success: false, message: `Access denied. This account is registered as ${user.role}.` });
        }

        // Record Attendance if student
        if (user.role === 'STUDENT') {
            const today = new Date().toISOString().split('T')[0];
            const existingAttendance = await Attendance.findOne({ 
                studentId: user._id, 
                date: today 
            });

            const now = new Date();

            if (!existingAttendance) {
                await Attendance.create({
                    studentId: user._id,
                    date: today,
                    loginTime: now,
                    lastActiveTime: now,
                    totalActiveMinutes: 0
                });
            } else {
                // If logging in again today, update lastActiveTime
                existingAttendance.lastActiveTime = now;
                await existingAttendance.save();
            }
        }

        const token = generateToken(user._id);

        return res.json({ 
            success: true, 
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: token,
            }
        });
    }
  }

  res.status(401).json({ success: false, message: 'Invalid credentials' });
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

// @desc    Get all students
// @route   GET /api/auth/students
// @access  Private (Instructor/Admin)
const getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'STUDENT' }).select('-password');
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Security: Do not reveal if email exists
      return res.status(200).json({ success: true, message: 'If the email exists, a code has been sent.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOTP = otp;
    user.otpExpiry = expiry;
    await user.save();

    // Send Email
    const message = `
Hello,

We received a request to reset the password for your Spheronix Technology account.

Your verification code is:

━━━━━━━━━━━━━━━━
   ${otp}
━━━━━━━━━━━━━━━━

This code is valid for 10 minutes. 
Please do not share this code with anyone for your security.

If you did not request this password reset, please ignore this email.

Regards, 
Spheronix Technology 
Security Team 
support@spheronixtechnology.com
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Spheronix Technology – Password Reset Verification Code',
            message: message,
        });
        
        console.log(`[AUTH] OTP sent to ${email}`);

        res.status(200).json({ success: true, message: 'If the email exists, a code has been sent.' });
    } catch (error) {
        user.resetOTP = undefined;
        user.otpExpiry = undefined;
        await user.save();
        console.error("Email send error:", error);
        return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ 
        email, 
        resetOTP: code, 
        otpExpiry: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    res.status(200).json({ success: true, message: 'Code verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  let { email, code, newPassword } = req.body;

  // Normalize email
  if (email) email = email.toLowerCase().trim();

  try {
    // Validate password strength
    // Min 8 chars, 1 uppercase, 1 number, 1 special char
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special char.' });
    }

    const user = await User.findOne({ 
        email, 
        resetOTP: code, 
        otpExpiry: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired session' });
    }

    user.password = newPassword; // Pre-save hook will hash it
    user.resetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  verifySignup, // Added verifySignup
  loginUser,
  getMe,
  getStudents,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
