const mongoose = require('mongoose');

const pendingUserSchema = mongoose.Schema(
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

module.exports = mongoose.model('PendingUser', pendingUserSchema);