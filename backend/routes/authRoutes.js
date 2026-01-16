import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getMe, 
  getStudents, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword, 
  verifySignup, 
  changePassword 
} from '../controllers/authController.js';
import { protect, instructor } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/verify-signup', verifySignup);
router.post('/login', loginUser);
router.get('/profile', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/students', protect, instructor, getStudents);

// Forgot Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
