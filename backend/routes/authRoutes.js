const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, getStudents, forgotPassword, verifyResetCode, resetPassword, verifySignup, changePassword } = require('../controllers/authController');
const { protect, instructor } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/verify-signup', verifySignup); // New Route
router.post('/login', loginUser);
router.get('/profile', protect, getMe);
router.put('/change-password', protect, changePassword); // New Route
router.get('/students', protect, instructor, getStudents);

// Forgot Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;
