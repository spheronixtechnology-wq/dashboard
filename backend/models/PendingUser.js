import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpiry: { type: Date, required: true }
  },
  {
    timestamps: true,
  }
);

// Auto-delete pending users after 1 hour to keep DB clean
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;
