import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import PendingUser from '../models/PendingUser.js';
import sendEmail from '../utils/sendEmail.js';

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, username, email, password, role } = req.body;


    // Normalize inputs
    if (email) email = email.toLowerCase().trim();
    if (username) username = username.toLowerCase().trim();

    if (!name || !email || !password || !username) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // 1. Check verified users first
    // This is the ONLY condition that should return 409 "Account already exists"
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
      const field = userExists.email === email ? 'Email' : 'Username';
      return res.status(409).json({ 
      success: false, 
      message: `${field} is already registered. Please login or use a different ${field.toLowerCase()}.` 
     });
    }
    // 2. Handle PendingUser
    // If email OR username exists in PendingUser, DELETE it.
    // This ensures we never get a unique constraint error from PendingUser collection,
    // and it guarantees that unverified (stale) accounts do not block new signups.
    await PendingUser.deleteMany({ $or: [{ email }, { username }] });

    // 3. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create fresh PendingUser
    const pendingUser = await PendingUser.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: role || 'STUDENT',
      otp,
      otpExpiry
    });

    // 5. Send Verification Email
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
      if (pendingUser?._id) {
        await PendingUser.deleteOne({ _id: pendingUser._id });
      }
      return res.status(500).json({ success: false, message: 'Could not send verification email. Please try again.' });
    }

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Signup OTP and Create Account
// @route   POST /api/auth/verify-signup
// @access  Public
const verifySignup = async (req, res) => {
    let { email, code } = req.body;
    if (email) email = email.toLowerCase().trim();

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
  try {
    let { email, password, role } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (typeof role === 'string' && role && user.role.toUpperCase() !== role.toUpperCase()) {
      return res
        .status(401)
        .json({ success: false, message: `Access denied. This account is registered as ${user.role}.` });
    }

    if (user.role === 'STUDENT') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const existingAttendance = await Attendance.findOne({
          studentId: user._id,
          date: today,
        });

        if (!existingAttendance) {
          await Attendance.create({
            studentId: user._id,
            date: today,
            loginTime: now,
            lastActiveTime: now,
            totalActiveMinutes: 0,
          });
        } else {
          existingAttendance.lastActiveTime = now;
          await existingAttendance.save();
        }
      } catch (attendanceError) {
        console.error('[AUTH] attendance record failed:', attendanceError?.message || attendanceError);
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
        token,
      },
    });
  } catch (error) {
    console.error('[AUTH] login error:', error?.message || error);
    const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : '';
    const host = typeof req.headers?.host === 'string' ? req.headers.host : '';
    const isLocal = /localhost|127\.0\.0\.1/i.test(origin) || /localhost|127\.0\.0\.1/i.test(host);
    const message =
      isLocal && (error?.message || error)
        ? String(error?.message || error).slice(0, 300)
        : 'Login failed. Please try again.';
    return res.status(500).json({ success: false, message });
  }
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
  let { email } = req.body;
  if (email) email = email.toLowerCase().trim();

  try {
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('_id email');

    if (!user) {
      // Security: Do not reveal if email exists
      return res.status(200).json({ success: true, message: 'If the email exists, a code has been sent.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      { $set: { resetOTP: otp, otpExpiry: expiry } }
    );

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
        await User.updateOne(
          { _id: user._id },
          { $unset: { resetOTP: '', otpExpiry: '' } }
        );
        console.error("Email send error:", error);
        return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('[AUTH] forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
  let { email, code } = req.body;
  if (email) email = email.toLowerCase().trim();

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

// @desc    Change Password (Authenticated)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // Validate new password strength
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special char.' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  verifySignup,
  loginUser,
  getMe,
  getStudents,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  changePassword
};
